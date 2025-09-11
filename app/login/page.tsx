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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col lg:flex-row">
      {/* Left Side - Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 xl:px-16 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-indigo-600">J</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Jemea Bot</h1>
              <p className="text-indigo-200">Admin Dashboard</p>
            </div>
          </div>
          
          <div className="space-y-6 text-white">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Manage Your Telegram Bot</h2>
              <p className="text-lg text-indigo-100 leading-relaxed">
                Powerful admin interface to control messages, monitor users, and analyze bot performance.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-300 rounded-full mt-2"></div>
                <p className="text-indigo-100">Create and schedule messages</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-300 rounded-full mt-2"></div>
                <p className="text-indigo-100">Monitor user engagement</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-300 rounded-full mt-2"></div>
                <p className="text-indigo-100">View detailed analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:px-12 xl:px-16">
        <div className="w-full max-w-md lg:max-w-lg">
          {/* Mobile Header (Mobile Only) */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">J</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Jemea Bot</h1>
            <p className="text-gray-600 mt-2">Admin Portal</p>
          </div>

          <Card className="shadow-xl border-0 lg:shadow-2xl">
            <CardHeader className="text-center pb-6 pt-8 lg:pt-10">
              <div className="hidden lg:block mb-6">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-xl font-bold text-white">J</span>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
              </div>
              <p className="text-gray-600 text-sm lg:text-base">
                Sign in to access your admin dashboard
              </p>
            </CardHeader>
          
            <CardBody className="px-6 lg:px-8 pb-8 lg:pb-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
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
                        input: "px-4 py-3 lg:py-4",
                        inputWrapper: "px-4 py-3 lg:py-4 shadow-sm border-gray-200 hover:border-indigo-300 focus-within:border-indigo-500"
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passcode
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter your passcode"
                      value={passcode || ""}
                      onChange={(e) => setValue("passcode", e.target.value)}
                      isInvalid={!!errors.passcode}
                      errorMessage={errors.passcode?.message}
                      isDisabled={pending}
                      size="lg"
                      classNames={{
                        input: "px-4 py-3 lg:py-4",
                        inputWrapper: "px-4 py-3 lg:py-4 shadow-sm border-gray-200 hover:border-indigo-300 focus-within:border-indigo-500"
                      }}
                    />
                  </div>
                </div>

                {errors.root?.message && (
                  <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-4">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 text-red-500 mt-0.5">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">Authentication Failed</h4>
                        <p className="mt-1">{errors.root.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 lg:py-4 shadow-lg hover:shadow-xl transition-all duration-200"
                  isLoading={pending}
                  isDisabled={pending}
                >
                  {pending ? "Signing in..." : "Sign in to Dashboard"}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Protected by enterprise-grade security
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;