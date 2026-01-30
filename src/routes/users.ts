import { Hono } from "hono";
import { UserService } from "../services/user.service";

const users = new Hono();

// Get all users
users.get("/", (c) => {
  const allUsers = UserService.getAll();
  return c.json(allUsers);
});

// Get user by ID
users.get("/:id", (c) => {
  const id = c.req.param("id");
  const user = UserService.getById(id);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
});

// Create new user
users.post("/", async (c) => {
  try {
    const body = await c.req.json();

    const user = UserService.create({
      name: body.name,
      email: body.email,
      role: body.role || "user",
    });

    return c.json(user, 201);
  } catch (error) {
    return c.json({ error: "Failed to create user", details: String(error) }, 400);
  }
});

export default users;
