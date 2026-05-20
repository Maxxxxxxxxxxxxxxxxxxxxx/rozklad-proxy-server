import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";

const authController = new Hono();

authController.post("/login", async (c) => {
  const { username, password } = await c.req.json();

  if (username === "admin" && password === "admin") {
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
