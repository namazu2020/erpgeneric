import { CustomUser, CustomSession } from "@/lib/auth";

declare module "better-auth" {
    interface User extends CustomUser { }
    interface Session extends CustomSession { }
}
