"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toInputDate } from "@/lib/admin/resources";
import {
  EMPLOYMENT_TYPES,
  type ExperienceDTO,
  type ExperienceInput,
  experienceSchema,
} from "@/lib/validations/portfolio";

import { DialogForm } from "../form/dialog-form";
import { Field } from "../form/field";
import { ImageUpload } from "../form/image-upload";
import { handleFormError } from "../form/server-errors";
import { TagInput } from "../form/tag-input";
import type { ResourceFormProps } from "../resource-manager";

function defaults(item: ExperienceDTO | null): ExperienceInput {
  return {
    company: item?.company ?? "",
    companyUrl: item?.companyUrl ?? "",
    logo: item?.logo ?? null,
    position: item?.position ?? "",
    location: item?.location ?? "",
    employmentType: item?.employmentType ?? "Full-time",
    startDate: toInputDate(item?.startDate, "month"),
    endDate: toInputDate(item?.endDate, "month"),
    currentlyWorking: item?.currentlyWorking ?? false,
    description: item?.description ?? "",
    technologies: item?.technologies ?? [],
  };
}

export function ExperienceForm({ item, submit, onCancel }: ResourceFormProps<ExperienceDTO>) {
  const form = useForm<ExperienceInput>({
    resolver: zodResolver(experienceSchema),
    defaultValues: defaults(item),
    mode: "onTouched",
  });
  const { register, control, handleSubmit, watch, setError, formState } = form;
  const { errors } = formState;
  const current = watch("currentlyWorking");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submit({ ...values, endDate: values.currentlyWorking ? "" : values.endDate });
    } catch (error) {
      handleFormError(error, setError);
    }
  });

  return (
    <DialogForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      isDirty={formState.isDirty}
      isSubmitting={formState.isSubmitting}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" htmlFor="company" required error={errors.company?.message}>
          <Input id="company" autoFocus aria-invalid={!!errors.company} {...register("company")} />
        </Field>
        <Field label="Position" htmlFor="position" required error={errors.position?.message}>
          <Input id="position" aria-invalid={!!errors.position} {...register("position")} />
        </Field>
        <Field label="Company website" htmlFor="companyUrl" error={errors.companyUrl?.message}>
          <Input id="companyUrl" type="url" placeholder="https://" {...register("companyUrl")} />
        </Field>
        <Field label="Location" htmlFor="location" error={errors.location?.message}>
          <Input id="location" placeholder="Remote" {...register("location")} />
        </Field>
        <Field label="Employment type" htmlFor="employmentType" error={errors.employmentType?.message}>
          <NativeSelect id="employmentType" {...register("employmentType")}>
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Currently working here" htmlFor="currentlyWorking">
          <div className="flex h-9 items-center">
            <Controller
              control={control}
              name="currentlyWorking"
              render={({ field }) => (
                <Switch id="currentlyWorking" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        </Field>
        <Field label="Start" htmlFor="startDate" required error={errors.startDate?.message}>
          <Input id="startDate" type="month" aria-invalid={!!errors.startDate} {...register("startDate")} />
        </Field>
        <Field label="End" htmlFor="endDate" error={errors.endDate?.message} hint={current ? "Shown as “Present”" : undefined}>
          <Input id="endDate" type="month" disabled={current} {...register("endDate")} />
        </Field>
      </div>
      <Field label="Company logo" error={errors.logo?.message}>
        <Controller
          control={control}
          name="logo"
          render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} folder="logos" label="logo" />}
        />
      </Field>
      <Field label="Description" htmlFor="description" error={errors.description?.message} hint="Shown when the card is expanded.">
        <Textarea id="description" rows={5} {...register("description")} />
      </Field>
      <Field label="Technologies" htmlFor="technologies" error={errors.technologies?.message} hint="Press Enter or comma to add.">
        <Controller
          control={control}
          name="technologies"
          render={({ field }) => (
            <TagInput id="technologies" value={field.value} onChange={field.onChange} placeholder="React, Node.js…" />
          )}
        />
      </Field>
    </DialogForm>
  );
}
