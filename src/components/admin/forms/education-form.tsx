"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toInputDate } from "@/lib/admin/resources";
import { type EducationDTO, type EducationInput, educationSchema } from "@/lib/validations/portfolio";

import { DialogForm } from "../form/dialog-form";
import { Field } from "../form/field";
import { ImageUpload } from "../form/image-upload";
import { handleFormError } from "../form/server-errors";
import type { ResourceFormProps } from "../resource-manager";

export function EducationForm({ item, submit, onCancel }: ResourceFormProps<EducationDTO>) {
  const { register, control, handleSubmit, setError, formState } = useForm<EducationInput>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: item?.institution ?? "",
      institutionUrl: item?.institutionUrl ?? "",
      logo: item?.logo ?? null,
      degree: item?.degree ?? "",
      field: item?.field ?? "",
      startDate: toInputDate(item?.startDate, "month"),
      endDate: toInputDate(item?.endDate, "month"),
      description: item?.description ?? "",
      grade: item?.grade ?? "",
    },
    mode: "onTouched",
  });
  const { errors } = formState;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submit(values);
    } catch (error) {
      handleFormError(error, setError);
    }
  });

  return (
    <DialogForm onSubmit={onSubmit} onCancel={onCancel} isDirty={formState.isDirty} isSubmitting={formState.isSubmitting}>
      <Field label="Institution" htmlFor="institution" required error={errors.institution?.message}>
        <Input id="institution" autoFocus aria-invalid={!!errors.institution} {...register("institution")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Degree" htmlFor="degree" required error={errors.degree?.message}>
          <Input id="degree" placeholder="B.Tech" aria-invalid={!!errors.degree} {...register("degree")} />
        </Field>
        <Field label="Field of study" htmlFor="field" error={errors.field?.message}>
          <Input id="field" placeholder="Computer Science" {...register("field")} />
        </Field>
        <Field label="Start" htmlFor="startDate" required error={errors.startDate?.message}>
          <Input id="startDate" type="month" aria-invalid={!!errors.startDate} {...register("startDate")} />
        </Field>
        <Field label="End" htmlFor="endDate" error={errors.endDate?.message} hint="Leave empty if ongoing.">
          <Input id="endDate" type="month" {...register("endDate")} />
        </Field>
        <Field label="Website" htmlFor="institutionUrl" error={errors.institutionUrl?.message}>
          <Input id="institutionUrl" type="url" placeholder="https://" {...register("institutionUrl")} />
        </Field>
        <Field label="Grade" htmlFor="grade" error={errors.grade?.message}>
          <Input id="grade" placeholder="8.5 CGPA" {...register("grade")} />
        </Field>
      </div>
      <Field label="Logo">
        <Controller
          control={control}
          name="logo"
          render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} folder="logos" label="logo" />}
        />
      </Field>
      <Field label="Description" htmlFor="description" error={errors.description?.message}>
        <Textarea id="description" rows={4} {...register("description")} />
      </Field>
    </DialogForm>
  );
}
