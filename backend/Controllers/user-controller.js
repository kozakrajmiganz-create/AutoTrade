import { userService } from "../Services/user-services.js";
export const userController = {
    async response(req, res) {
        console.log("eljut contr")
        const message = await userService.response();
        return res.json(message);
    }
}

