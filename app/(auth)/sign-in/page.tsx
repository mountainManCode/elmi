"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Anchor,
  Box,
  Button,
  Card,
  Center,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { authClient } from "@/lib/auth-client";

type FormValues = {
  name: string;
  email: string;
  password: string;
};

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    initialValues: { name: "", email: "", password: "" },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
      password: (v) =>
        v.length >= 8 ? null : "Password must be at least 8 characters",
      name: (v) =>
        mode === "sign-up" && v.trim().length === 0
          ? "Name is required"
          : null,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (mode === "sign-up") {
        const { error } = await authClient.signUp.email({
          email: values.email,
          password: values.password,
          name: values.name,
        });
        if (error) {
          notifications.show({
            title: "Sign up failed",
            message: error.message,
            color: "red",
          });
          return;
        }
      } else {
        const { error } = await authClient.signIn.email({
          email: values.email,
          password: values.password,
        });
        if (error) {
          notifications.show({
            title: "Sign in failed",
            message: error.message,
            color: "red",
          });
          return;
        }
      }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh" px="md">
      <Card shadow="md" padding="xl" radius="md" w={{ base: "100%", xs: 400 }} withBorder>
        <Stack gap="lg">
          <Box>
            <Title order={2}>
              {mode === "sign-in" ? "Sign in to Elmi" : "Create your account"}
            </Title>
            <Text size="sm" c="dimmed" mt={4}>
              {mode === "sign-in"
                ? "Enter your credentials to continue"
                : "Set up your consultant account"}
            </Text>
          </Box>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              {mode === "sign-up" && (
                <TextInput
                  label="Name"
                  placeholder="Jane Smith"
                  {...form.getInputProps("name")}
                />
              )}
              <TextInput
                label="Email"
                placeholder="you@consultancy.com"
                {...form.getInputProps("email")}
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                {...form.getInputProps("password")}
              />
              <Button type="submit" fullWidth loading={loading} mt="xs">
                {mode === "sign-in" ? "Sign in" : "Create account"}
              </Button>
            </Stack>
          </form>

          <Text size="sm" ta="center">
            {mode === "sign-in" ? (
              <>
                Don&apos;t have an account?{" "}
                <Anchor
                  component="button"
                  type="button"
                  onClick={() => {
                    setMode("sign-up");
                    form.clearErrors();
                  }}
                >
                  Sign up
                </Anchor>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Anchor
                  component="button"
                  type="button"
                  onClick={() => {
                    setMode("sign-in");
                    form.clearErrors();
                  }}
                >
                  Sign in
                </Anchor>
              </>
            )}
          </Text>
        </Stack>
      </Card>
    </Center>
  );
}
