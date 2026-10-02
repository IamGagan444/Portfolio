"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SKILL_CATEGORIES, type SkillDTO, type SkillInput, skillSchema } from "@/lib/validations/portfolio";

import { DialogForm } from "../form/dialog-form";
import { Field } from "../form/field";
import { handleFormError } from "../form/server-errors";
import type { ResourceFormProps } from "../resource-manager";

export function SkillForm({ item, submit, onCancel }: ResourceFormProps<SkillDTO>) {
  const { register, handleSubmit, watch, setError, formState } = useForm<SkillInput>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: item?.name ?? "",
      category: item?.category ?? "Frontend",
      proficiency: item?.proficiency ?? 0,
      icon: item?.icon ?? "",
    },
    mode: "onTouched",
  });
  const { errors } = formState;
  const proficiency = watch("proficiency");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submit(values);
    } catch (error) {
      handleFormError(error, setError);
    }
  });

  return (
    <DialogForm onSubmit={onSubmit} onCancel={onCancel} isDirty={formState.isDirty} isSubmitting={formState.isSubmitting}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" autoFocus aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Category" htmlFor="category" error={errors.category?.message}>
          <NativeSelect id="category" {...register("category")}>
            {SKILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field
        label={`Proficiency — ${Number.isFinite(proficiency) ? proficiency : 0}%`}
        htmlFor="proficiency"
        error={errors.proficiency?.message}
        hint="Used for ordering and admin reference; 0 means unspecified."
      >
        <input
          id="proficiency"
          type="range"
          min={0}
          max={100}
          step={5}
          className="w-full accent-foreground"
          {...register("proficiency", { valueAsNumber: true })}
        />
      </Field>
      <Field label="Icon URL" htmlFor="icon" error={errors.icon?.message} hint="Optional image URL or /path for an icon.">
        <Input id="icon" placeholder="https://… or /icons/react.svg" {...register("icon")} />
      </Field>
    </DialogForm>
  );
}
