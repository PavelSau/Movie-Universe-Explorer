-- Seed 5 users — all passwords are: password123
INSERT INTO users (username, password_hash, display_name) VALUES
  ('john', '$2b$10$ffWuXFYaU3MqRBrQmiZtRObH4w5h4bOBULu6zOk4LjzCx13VE1ieC', 'John Doe'),
  ('jane', '$2b$10$ffWuXFYaU3MqRBrQmiZtRObH4w5h4bOBULu6zOk4LjzCx13VE1ieC', 'Jane Smith'),
  ('alex', '$2b$10$ffWuXFYaU3MqRBrQmiZtRObH4w5h4bOBULu6zOk4LjzCx13VE1ieC', 'Alex Johnson'),
  ('maria', '$2b$10$ffWuXFYaU3MqRBrQmiZtRObH4w5h4bOBULu6zOk4LjzCx13VE1ieC', 'Maria Garcia'),
  ('sam', '$2b$10$ffWuXFYaU3MqRBrQmiZtRObH4w5h4bOBULu6zOk4LjzCx13VE1ieC', 'Sam Wilson')
ON CONFLICT (username) DO NOTHING;
