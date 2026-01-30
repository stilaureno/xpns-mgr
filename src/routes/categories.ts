import { Hono } from "hono";
import { CategoryService } from "../services/category.service";

const categories = new Hono();

// Get all categories
categories.get("/", (c) => {
  const allCategories = CategoryService.getAll();
  return c.json(allCategories);
});

// Get category by ID
categories.get("/:id", (c) => {
  const id = c.req.param("id");
  const category = CategoryService.getById(id);

  if (!category) {
    return c.json({ error: "Category not found" }, 404);
  }

  return c.json(category);
});

// Create new category
categories.post("/", async (c) => {
  try {
    const body = await c.req.json();

    const category = CategoryService.create({
      name: body.name,
      description: body.description,
      color: body.color || "#6B7280",
    });

    return c.json(category, 201);
  } catch (error) {
    return c.json({ error: "Failed to create category", details: String(error) }, 400);
  }
});

// Update category
categories.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.color) updates.color = body.color;

    const category = CategoryService.update(id, updates);

    if (!category) {
      return c.json({ error: "Category not found" }, 404);
    }

    return c.json(category);
  } catch (error) {
    return c.json({ error: "Failed to update category", details: String(error) }, 400);
  }
});

// Delete category
categories.delete("/:id", (c) => {
  const id = c.req.param("id");
  const success = CategoryService.delete(id);

  if (!success) {
    return c.json({ error: "Category not found" }, 404);
  }

  return c.json({ message: "Category deleted successfully" });
});

export default categories;
