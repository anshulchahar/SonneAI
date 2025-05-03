import type { Adapter, AdapterAccount, AdapterUser } from 'next-auth/adapters';
import { supabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export function SupabaseAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">) {
      const uuid = uuidv4();
      const { error } = await supabaseAdmin
        .from('users')
        .insert({
          id: uuid,
          email: user.email,
          emailVerified: user.emailVerified,
          name: user.name,
          image: user.image,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: uuid,
        email: user.email,
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
        name: user.name,
        image: user.image,
      };
    },

    async getUser(id: string) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      if (!data) return null;

      return {
        id: data.id,
        email: data.email,
        emailVerified: data.emailVerified ? new Date(data.emailVerified) : null,
        name: data.name,
        image: data.image,
      };
    },

    async getUserByEmail(email: string) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        emailVerified: data.emailVerified ? new Date(data.emailVerified) : null,
        name: data.name,
        image: data.image,
      };
    },

    async getUserByAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      const { data: accountData, error: accountError } = await supabaseAdmin
        .from('accounts')
        .select('*')
        .eq('providerAccountId', providerAccountId)
        .eq('provider', provider)
        .single();

      if (accountError || !accountData) return null;

      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', accountData.userId)
        .single();

      if (userError || !userData) return null;

      return {
        id: userData.id,
        email: userData.email,
        emailVerified: userData.emailVerified ? new Date(userData.emailVerified) : null,
        name: userData.name,
        image: userData.image,
      };
    },

    async updateUser(user: Partial<AdapterUser> & { id: string }) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        email: data.email,
        emailVerified: data.emailVerified ? new Date(data.emailVerified) : null,
        name: data.name,
        image: data.image,
      };
    },

    async deleteUser(userId: string) {
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },

    async linkAccount(account: AdapterAccount) {
      const { error } = await supabaseAdmin.from('accounts').insert({
        id: uuidv4(),
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      });

      if (error) throw error;
      return account;
    },

    async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      const { error } = await supabaseAdmin
        .from('accounts')
        .delete()
        .match({ providerAccountId, provider });

      if (error) throw error;
    },

    async createSession({ sessionToken, userId, expires }: { sessionToken: string; userId: string; expires: Date }) {
      const { error } = await supabaseAdmin.from('sessions').insert({
        id: uuidv4(),
        userId,
        expires,
        sessionToken,
      });

      if (error) throw error;
      
      return {
        id: uuidv4(),
        sessionToken,
        userId,
        expires,
      };
    },

    async getSessionAndUser(sessionToken: string) {
      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('sessionToken', sessionToken)
        .single();

      if (sessionError || !sessionData) return null;

      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', sessionData.userId)
        .single();

      if (userError || !userData) return null;

      return {
        session: {
          id: sessionData.id,
          sessionToken: sessionData.sessionToken,
          userId: sessionData.userId,
          expires: new Date(sessionData.expires),
        },
        user: {
          id: userData.id,
          email: userData.email,
          emailVerified: userData.emailVerified ? new Date(userData.emailVerified) : null,
          name: userData.name,
          image: userData.image,
        },
      };
    },

    async updateSession({ sessionToken, expires, userId }: { sessionToken: string; expires?: Date; userId?: string }) {
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .update({
          expires,
          userId,
        })
        .eq('sessionToken', sessionToken)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: new Date(data.expires),
      };
    },

    async deleteSession(sessionToken: string) {
      const { error } = await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('sessionToken', sessionToken);

      if (error) throw error;
    },
  };
}