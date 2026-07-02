export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

export type Thread = {
  id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
  participants: Profile[];
};

export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  readBy: string[];
};
