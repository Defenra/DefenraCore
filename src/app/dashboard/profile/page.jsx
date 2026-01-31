"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Bento Card Component
function BentoCard({ children, className }) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
        "hover:border-border hover:shadow-lg hover:shadow-primary/5",
        className,
      )}
    >
      {children}
    </Card>
  );
}

// Profile Skeleton
function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-6 py-4 md:py-6 px-4 lg:px-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BentoCard>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </BentoCard>

        <BentoCard>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="border-t pt-4 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </BentoCard>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || "",
        email: session.user.email || "",
      }));
    }
  }, [session]);

  if (status === "loading") {
    return <ProfileSkeleton />;
  }

  if (!session) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      setError(t("profile.errors.passwordMismatch"));
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError(t("profile.errors.passwordLength"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("profile.errors.updateFailed"));
      }

      setSuccess(t("profile.success"));
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      await update();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    );
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 py-4 md:py-6 px-4 lg:px-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t("profile.title")}
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          {t("profile.description")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <BentoCard>
          <CardHeader>
            <CardTitle>{t("profile.infoCard.title")}</CardTitle>
            <CardDescription>
              {t("profile.infoCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={session.user?.image}
                  alt={session.user?.name}
                />
                <AvatarFallback className="text-lg">
                  {getInitials(session.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{t("profile.role")}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {session.user?.role || "user"}
                </p>
              </div>
            </div>
          </CardContent>
        </BentoCard>

        {/* Edit Profile Card */}
        <BentoCard>
          <CardHeader>
            <CardTitle>{t("profile.editCard.title")}</CardTitle>
            <CardDescription>
              {t("profile.editCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("profile.form.name")}</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("profile.form.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={loading}
                  required
                />
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-4">
                  {t("profile.form.changePassword")}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">
                      {t("profile.form.currentPassword")}
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentPassword: e.target.value,
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      {t("profile.form.newPassword")}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          newPassword: e.target.value,
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {t("profile.form.confirmPassword")}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                  {success}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("profile.saving") : t("profile.save")}
              </Button>
            </form>
          </CardContent>
        </BentoCard>
      </div>
    </div>
  );
}
