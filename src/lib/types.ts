export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  avatar_key: string | null;
};

export type Thread = {
  id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
  participants: Profile[];
  theme: string | null;
  background_url: string | null;
  avatar_key: string | null;
  avatar_url: string | null;
};

export type Reaction = {
  emoji: string;
  userId: string;
};

export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  reply_to_id: string | null;
  created_at: string;
  readBy: string[];
  reactions: Reaction[];
};
