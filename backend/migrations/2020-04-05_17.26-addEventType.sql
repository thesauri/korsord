-- Migrate schema with only drawEvents in events table to
-- also include write events

BEGIN TRANSACTION;

create table if not exists eventTypes(
    typeId integer primary key,
    type text unique not null
);

insert or ignore into eventTypes(typeId, type) values (0, 'DRAW');
insert or ignore into eventTypes(typeId, type) values (1, 'WRITE');

CREATE TABLE IF NOT EXISTS new_events(
    id integer primary key,
    url text,
    eventType int,
    event text,
    foreign key(eventType) references eventTypes(typeId)
);

INSERT INTO new_events(id, url, eventType, event)
SELECT id, url, 0, event
FROM events;

DROP TABLE events;

ALTER TABLE new_events RENAME TO events;

COMMIT;
