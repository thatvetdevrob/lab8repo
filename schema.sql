DROP TABLE IF EXISTS past_queries;


CREATE TABLE past_queries (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude FLOAT,
  longitude FLOAT
);