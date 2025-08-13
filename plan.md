# Plan: Add Product from Telegram for Super Admin

- [x] **Create `plan.md`:** Create a file named `plan.md` to track the progress.
- [x] **Modify `User` Entity:** Add a `role` field to `src/modules/users/user.entity.ts`.
- [x] **Update `UsersService`:** Add logic to handle user creation and role checking.
- [x] **Update `TelegramModule`:** Import `UsersModule` to make `UsersService` available.
- [x] **Implement `/addproduct` command:** Add the command to `telegram.service.ts` with an admin check.