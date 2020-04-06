BEGIN TRANSACTION;

create table if not exists crosswords(
    crosswordId integer primary key,
    newspaper text not null,
    publishedDate text not null,
    imageUrl text not null,
    metadataUrl text not null
);

insert into crosswords(newspaper, publishedDate, imageUrl, metadataUrl) values ('HBL', '2020-03-27', 'uploads/2020-03-27/crossword.jpg', 'uploads/2020-03-27/squares.json');
insert into crosswords(newspaper, publishedDate, imageUrl, metadataUrl) values ('HBL', '2020-04-03', 'uploads/2020-04-03/crossword.jpg', 'uploads/2020-04-03/squares.json');

create table if not exists games(
    url varchar primary key,
    crossword int not null,
    foreign key(crossword) references crosswords(crosswordId)
);

COMMIT;