"use client";

import {
  type SignInWithUsernamePasswordResult,
  useSignInWithUsernamePassword,
} from "@convex-dev/auth/methods/username-password/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function SignIn() {
  const { signIn, pending } = useSignInWithUsernamePassword(api.auth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const loading = pending || redirecting;
  const router = useRouter();
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Chu kỳ của tôi</CardTitle>
          <CardDescription>Đăng nhập để tiếp tục.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              void signIn({
                username,
                password,
              }).then((result) => {
                if (result.status === "complete") {
                  setRedirecting(true);
                  router.push("/");
                } else {
                  setError(errorMessage(result.userError));
                }
              });
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </Field>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={loading}>
                {loading && <Spinner />}
                Đăng nhập
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

type UserError = Extract<
  SignInWithUsernamePasswordResult,
  { status: "error" }
>["userError"];

function errorMessage(userError: UserError): string {
  switch (userError.error) {
    case "USER_NOT_FOUND":
      return "Không tồn tại tài khoản với tên đăng nhập này.";
    case "INVALID_CREDENTIALS":
      return "Tên đăng nhập hoặc mật khẩu không đúng.";
    case "RATE_LIMITED":
      return `Thử quá nhiều lần. Vui lòng thử lại sau ${Math.ceil(userError.retryAfterMs / 1000)} giây.`;
    case "PASSWORD_TOO_SHORT":
      return `Mật khẩu phải có ít nhất ${userError.minimumLength} ký tự.`;
    case "PASSWORD_TOO_LONG":
      return `Mật khẩu chỉ được có tối đa ${userError.maximumLength} ký tự.`;
    case "PASSWORD_HAS_SURROUNDING_WHITESPACE":
      return "Mật khẩu không được bắt đầu hoặc kết thúc bằng khoảng trắng.";
    case "OTHER_ERROR":
      console.error(userError.cause);
      return "Đã có lỗi xảy ra. Vui lòng thử lại.";
    default:
      userError satisfies never;
      return "Đã có lỗi xảy ra. Vui lòng thử lại.";
  }
}
