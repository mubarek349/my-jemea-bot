"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/zodSchema";
import { authenticate } from "../../actions/authentication";
import { Button, Input, Card, CardBody, CardHeader } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

type FormValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const router = useRouter();
  const {
    handleSubmit,
    register,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });

  const [pending, startTransition] = useTransition();
  const phoneno = watch("phoneno");
  const passcode = watch("passcode");

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await authenticate(values);

      if (result.ok) {
        toast.success(result.message);
        router.push(result.redirectTo ?? "/admin");
        return;
      }

      if (result.field && result.field !== "form") {
        setError(result.field, { type: "server", message: result.message });
      } else {
        setError("root", { type: "server", message: result.message });
      }
      toast.error(result.message);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-0">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">J</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Jemea Bot</h1>
            <p className="text-sm text-gray-500 mt-1">Admin Portal - Sign in to continue</p>
          </CardHeader>
        
          <CardBody className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <Input
                type="tel"
                placeholder="09*********"
                value={phoneno || ""}
                onChange={(e) => setValue("phoneno", e.target.value)}
                isInvalid={!!errors.phoneno}
                errorMessage={errors.phoneno?.message}
                isDisabled={pending}
                size="lg"
                classNames={{
                  input: "px-4 py-3",
                  inputWrapper: "px-4 py-3"
                }}
              />

              <Input
                type="password"
                placeholder="********"
                value={passcode || ""}
                onChange={(e) => setValue("passcode", e.target.value)}
                isInvalid={!!errors.passcode}
                errorMessage={errors.passcode?.message}
                isDisabled={pending}
                size="lg"
                classNames={{
                  input: "px-4 py-3",
                  inputWrapper: "px-4 py-3"
                }}
              />

              {errors.root?.message && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
                  {errors.root.message}
                </div>
              )}

              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full"
                isLoading={pending}
                isDisabled={pending}
              >
                {pending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;