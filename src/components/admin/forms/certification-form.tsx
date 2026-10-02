"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { toInputDate } from "@/lib/admin/resources";
import {
  type CertificationDTO,
  type CertificationInput,
  certificationSchema,
} from "@/lib/validations/portfolio";

import { DialogForm } from "../form/dialog-form";
import { Field } from "../form/field";
import { ImageUpload } from "../form/image-upload";
import { handleFormError } from "../form/server-errors";
import type { ResourceFormProps } from "../resource-manager";

export function CertificationForm({ item, submit, onCancel }: ResourceFormProps<CertificationDTO>) {
  const { register, control, handleSubmit, setError, formState } = useForm<CertificationInput>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: item?.name ?? "",
      issuer: item?.issuer ?? "",
      issueDate: toInputDate(item?.issueDate, "date"),
      expiryDate: toInputDate(item?.expiryDate, "date"),
      credentialId: item?.credentialId ?? "",
      credentialUrl: item?.credentialUrl ?? "",
      certificateImage: item?.certificateImage ?? null,
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Certification name" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" autoFocus aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Issuer" htmlFor="issuer" required error={errors.issuer?.message}>
          <Input id="issuer" placeholder="AWS, Google, Coursera…" aria-invalid={!!errors.issuer} {...register("issuer")} />
        </Field>
        <Field label="Issue date" htmlFor="issueDate" required error={errors.issueDate?.message}>
          <Input id="issueDate" type="date" aria-invalid={!!errors.issueDate} {...register("issueDate")} />
        </Field>
        <Field label="Expiry date" htmlFor="expiryDate" error={errors.expiryDate?.message} hint="Leave empty if it doesn't expire.">
          <Input id="expiryDate" type="date" {...register("expiryDate")} />
        </Field>
        <Field label="Credential ID" htmlFor="credentialId" error={errors.credentialId?.message}>
          <Input id="credentialId" {...register("credentialId")} />
        </Field>
        <Field label="Credential URL" htmlFor="credentialUrl" error={errors.credentialUrl?.message}>
          <Input id="credentialUrl" type="url" placeholder="https://" {...register("credentialUrl")} />
        </Field>
      </div>
      <Field label="Certificate image / badge">
        <Controller
          control={control}
          name="certificateImage"
          render={({ field }) => (
            <ImageUpload value={field.value} onChange={field.onChange} folder="certifications" label="image" />
          )}
        />
      </Field>
    </DialogForm>
  );
}
