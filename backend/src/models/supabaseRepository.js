import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

function mapUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

export function createSupabaseRepository() {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  async function loadPosts(currentUserId, circleId = null) {
    let query = supabase
    .from('posts')
    .select(`
      id,
      user_id,
      circle_id,
      content,
      image_url,
      created_at,
      users:user_id ( id, name, email, bio, avatar_url, skills, created_at ),
      circles:circle_id ( id, name, description, created_by, created_at ),
      comments (
        id,
        user_id,
        post_id,
        content,
        created_at,
        users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
      ),
      likes ( id, user_id, post_id )
    `)
    .order('created_at', { ascending: false });

    if (circleId) {
      query = query.eq('circle_id', circleId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      circle_id: post.circle_id,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at,
      author: mapUser(post.users),
      circle: post.circles,
      comments: (post.comments || []).map((comment) => ({
        ...comment,
        author: mapUser(comment.users),
      })),
      commentsCount: (post.comments || []).length,
      likesCount: (post.likes || []).length,
      likedByMe: currentUserId
        ? (post.likes || []).some((like) => like.user_id === currentUserId)
        : false,
    }));
  }

  return {
    async findUserById(id) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, bio, avatar_url, skills, created_at')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async findUserWithPasswordByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async createUser({ name, email, passwordHash }) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name,
          email,
          password_hash: passwordHash,
        })
        .select('id, name, email, bio, avatar_url, skills, created_at')
        .single();
      if (error) throw error;
      return data;
    },
    async updateProfile(userId, payload) {
      const { data, error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', userId)
        .select('id, name, email, bio, avatar_url, skills, created_at')
        .single();
      if (error) throw error;
      return data;
    },
    async getFeed(currentUserId, circleId = null) {
      return loadPosts(currentUserId, circleId);
    },
    async createPost({ userId, content, imageUrl, circleId }) {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content,
          image_url: imageUrl,
          circle_id: circleId || null,
        });
      if (error) throw error;

      const posts = await loadPosts(userId, circleId || null);
      return posts[0];
    },
    async toggleLike(postId, userId) {
      const { data: existing, error: existingError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();
      if (existingError) throw existingError;

      if (existing) {
        const { error } = await supabase.from('likes').delete().eq('id', existing.id);
        if (error) throw error;
        return { liked: false };
      }

      const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
      if (error) throw error;
      return { liked: true };
    },
    async addComment(postId, userId, content) {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: userId, content })
        .select(`
          id,
          user_id,
          post_id,
          content,
          created_at,
          users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .single();
      if (error) throw error;
      return {
        ...data,
        author: mapUser(data.users),
      };
    },
    async listCircles(userId) {
      const { data, error } = await supabase
        .from('circles')
        .select(`
          id,
          name,
          description,
          created_by,
          created_at,
          circle_members ( user_id )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;

      return data.map((circle) => ({
        id: circle.id,
        name: circle.name,
        description: circle.description,
        created_by: circle.created_by,
        created_at: circle.created_at,
        membersCount: (circle.circle_members || []).length,
        joined: userId
          ? (circle.circle_members || []).some((member) => member.user_id === userId)
          : false,
      }));
    },
    async createCircle({ name, description, userId }) {
      const { data, error } = await supabase
        .from('circles')
        .insert({
          name,
          description,
          created_by: userId,
        })
        .select('*')
        .single();
      if (error) throw error;

      const { error: memberError } = await supabase.from('circle_members').insert({
        user_id: userId,
        circle_id: data.id,
      });
      if (memberError) throw memberError;

      return {
        ...data,
        membersCount: 1,
        joined: true,
      };
    },
    async joinCircle(circleId, userId) {
      const { error } = await supabase.from('circle_members').upsert(
        {
          user_id: userId,
          circle_id: circleId,
        },
        { onConflict: 'user_id,circle_id', ignoreDuplicates: true },
      );
      if (error) throw error;
      return { joined: true };
    },
    async getCircle(circleId, userId) {
      const { data, error } = await supabase
        .from('circles')
        .select(`
          id,
          name,
          description,
          created_by,
          created_at,
          circle_members ( user_id )
        `)
        .eq('id', circleId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        created_by: data.created_by,
        created_at: data.created_at,
        membersCount: (data.circle_members || []).length,
        joined: userId
          ? (data.circle_members || []).some((member) => member.user_id === userId)
          : false,
      };
    },
  };
}
