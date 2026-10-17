import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createAdminClient: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  update: vi.fn(),
  row: { employee_id: 42 } as { employee_id: number } | null,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { approveEmployee } from "./employees";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.row = { employee_id: 42 };
  mocks.createAdminClient.mockReturnValue({
    from: () => ({
      update: mocks.update.mockReturnValue({
        eq: () => ({
          eq: () => ({
            eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: mocks.row, error: null }) }) }),
          }),
        }),
      }),
    }),
  });
});

describe("approveEmployee", () => {
  it("activates only an eligible pending employee and redirects to Active", async () => {
    const form = new FormData();
    form.set("employee_id", "42");

    await approveEmployee(form);

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith({ isPending: false });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/employees");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/employees");
  });

  it("does not approve an employee whose pending state changed", async () => {
    mocks.row = null;
    const form = new FormData();
    form.set("employee_id", "42");

    await expect(approveEmployee(form)).rejects.toThrow("Employee is no longer pending.");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
