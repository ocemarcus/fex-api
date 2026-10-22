CREATE OR REPLACE FUNCTION eventsNotification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'events_notification',
    NEW.id::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eventsNotification
AFTER INSERT ON "eventsNotification"
FOR EACH ROW
EXECUTE FUNCTION eventsNotification();