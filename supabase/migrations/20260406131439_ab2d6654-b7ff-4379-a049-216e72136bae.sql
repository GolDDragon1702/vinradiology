
-- Create medical_reports table
CREATE TABLE public.medical_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT,
  image_type TEXT,
  clinical_notes TEXT,
  draft_report TEXT,
  refined_report TEXT,
  refinement_log JSONB,
  task_type TEXT NOT NULL DEFAULT 'report_generation',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.medical_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own reports" ON public.medical_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.medical_reports FOR DELETE USING (auth.uid() = user_id);

-- Create vqa_sessions table
CREATE TABLE public.vqa_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT,
  image_type TEXT,
  clinical_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vqa_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.vqa_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.vqa_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.vqa_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create vqa_messages table
CREATE TABLE public.vqa_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.vqa_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vqa_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.vqa_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.vqa_sessions WHERE id = vqa_messages.session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create own messages" ON public.vqa_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.vqa_sessions WHERE id = vqa_messages.session_id AND user_id = auth.uid())
);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_medical_reports_updated_at BEFORE UPDATE ON public.medical_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vqa_sessions_updated_at BEFORE UPDATE ON public.vqa_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_medical_reports_user_id ON public.medical_reports(user_id);
CREATE INDEX idx_vqa_sessions_user_id ON public.vqa_sessions(user_id);
CREATE INDEX idx_vqa_messages_session_id ON public.vqa_messages(session_id);
