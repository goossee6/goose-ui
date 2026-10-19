// 表格 / 列表几个演示页共用的示例数据与列配置。
// 拆页后每个页面都要用到同一份 users，放这里避免四处复制。
import type { Column } from "goose-ui";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "正常" | "超额";
  storage: number;
  createdAt: string;
}

export const users: User[] = [
  { id: 1, name: "张三", email: "zhangsan@example.com", role: "管理员", status: "正常", storage: 45, createdAt: "2024-01-15" },
  { id: 2, name: "李四", email: "lisi@example.com", role: "编辑", status: "正常", storage: 78, createdAt: "2024-02-20" },
  { id: 3, name: "王五", email: "wangwu@example.com", role: "访客", status: "超额", storage: 105, createdAt: "2024-03-08" },
  { id: 4, name: "赵六", email: "zhaoliu@example.com", role: "编辑", status: "正常", storage: 22, createdAt: "2024-03-22" },
  { id: 5, name: "钱七", email: "qianqi@example.com", role: "管理员", status: "正常", storage: 91, createdAt: "2024-04-11" },
  { id: 6, name: "孙八", email: "sunba@example.com", role: "编辑", status: "正常", storage: 36, createdAt: "2024-05-06" },
  { id: 7, name: "周九", email: "zhoujiu@example.com", role: "访客", status: "正常", storage: 12, createdAt: "2024-06-18" },
  { id: 8, name: "吴十", email: "wushi@example.com", role: "编辑", status: "超额", storage: 118, createdAt: "2024-07-02" },
  { id: 9, name: "郑十一", email: "zhengshiyi@example.com", role: "访客", status: "正常", storage: 64, createdAt: "2024-08-24" },
  { id: 10, name: "冯十二", email: "fengshier@example.com", role: "管理员", status: "正常", storage: 53, createdAt: "2024-09-30" },
];

/* 表头吸顶演示专用：行数够多，容器才有可滚动的余量，表头吸顶才看得出来。
   不并进 users，避免把其它纯展示的示例也一起拉长。 */
export const manyUsers: User[] = Array.from({ length: 30 }, (_, i) => {
  const u = users[i % users.length];
  const n = i + 1;
  return {
    ...u,
    id: n,
    name: `${u.name}${n > users.length ? ` ${Math.ceil(n / users.length)}` : ""}`,
    email: u.email.replace("@", `${n}@`),
    createdAt: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
  };
});

export const columns: Column<User>[] = [
  { id: "id", header: "ID", render: (r) => String(r.id), align: "center", mono: true },
  { id: "name", header: "姓名", render: (r) => r.name },
  { id: "email", header: "邮箱", render: (r) => r.email },
  { id: "role", header: "角色", render: (r) => r.role },
  { id: "status", header: "状态", render: (r) => r.status, custom: true, sortAccessor: (r) => r.status },
  { id: "storage", header: "存储用量", render: (r) => `${r.storage}%`, align: "right", sortAccessor: (r) => r.storage },
  { id: "createdAt", header: "创建时间", render: (r) => r.createdAt, align: "right" },
];

export const simpleColumns: Column<User>[] = [
  { id: "name", header: "姓名", render: (r) => r.name, sortable: false },
  { id: "email", header: "邮箱", render: (r) => r.email, sortable: false },
  { id: "role", header: "角色", render: (r) => r.role, sortable: false },
  { id: "storage", header: "存储用量", render: (r) => `${r.storage}%`, align: "right", sortable: false },
];
