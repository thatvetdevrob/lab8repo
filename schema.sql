DROP TABLE IF EXISTS saved_queries;


CREATE TABLE saved_queries (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude FLOAT,
  longitude FLOAT
);