import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        try {
          // Authentification via Supabase
          const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })
          
          if (error || !data.user) {
            console.error('Erreur auth Supabase:', error?.message)
            return null
          }
          
          return {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name || data.user.email,
          }
        } catch (error) {
          console.error('Erreur authorize:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google') {
          console.log('🔍 Google signIn callback - user:', user.id, user.email)
          
          // D'abord créer l'utilisateur dans Supabase Auth
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email!,
            email_confirm: true,
            user_metadata: {
              full_name: user.name,
              avatar_url: user.image,
              provider: 'google'
            }
          })
          
          if (authError && !authError.message.includes('already registered')) {
            console.error('Erreur création user Supabase Auth:', authError)
            return false
          }
          
          const userId = authUser?.user?.id || user.id
          
          // Puis créer le profil
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: userId,
              email: user.email!,
              full_name: user.name,
              avatar_url: user.image,
            }, {
              onConflict: 'id'
            })
          
          if (profileError) {
            console.error('Erreur création profil:', profileError)
            return false
          }
          
          // Mettre à jour l'ID utilisateur pour NextAuth
          user.id = userId
          
          console.log('✅ Google user créé avec succès:', userId)
          return true
        }
        
        // Pour email/password, vérifier que le profil existe
        if (account?.provider === 'credentials') {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single()
          
          if (!profile) {
            console.error('Profil manquant pour user credentials:', user.id)
            return false
          }
        }
        
        return true
      } catch (error) {
        console.error('Erreur callback signIn:', error)
        return false
      }
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        
        // Enrichir la session avec le profil Supabase
        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', token.sub)
            .single()
          
          if (profile) {
            session.user.name = profile.full_name || session.user.name
            session.user.image = profile.avatar_url || session.user.image
          }
        } catch (error) {
          console.error('Erreur enrichissement session:', error)
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    }
  },
}
