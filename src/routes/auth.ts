import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";

const authController = new Hono();
const admin_password = process.env.ADMIN_PASSWORD || "admin";

authController.post("/login", async (c) => {
  const { password } = await c.req.json();

  if (password === admin_password) {
    setCookie(c, "session_user", "admin", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 60 * 60,
    });

    return c.json({ message: "Login successful!" });
  }

  return c.json({ message: "Invalid credentials" }, 401);
});

authController.post("/logout", (c) => {
  deleteCookie(c, "session_user");
  return c.json({ message: "Logged out successfully" });
});

export default authController;
