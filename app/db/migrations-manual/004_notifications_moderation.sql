-- Partial index: only unread notifications (much smaller, hits the common case)
CREATE INDEX IF NOT EXISTS idx_user_notification_unread
  ON user_notification (user_id, created_at DESC)
  WHERE read = false;

-- Partial index: pending reports for admin queue
CREATE INDEX IF NOT EXISTS idx_report_pending
  ON report (created_at DESC)
  WHERE status = 'pending';

-- Auto-set delivered_at on insert
CREATE OR REPLACE FUNCTION set_notification_delivered()
RETURNS trigger AS $$
BEGIN
  NEW.delivered_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notification_delivered ON user_notification;

CREATE TRIGGER trg_notification_delivered
  BEFORE INSERT ON user_notification
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_delivered();