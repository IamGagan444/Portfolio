"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toInputDate } from "@/lib/admin/resources";
import { type HackathonDTO, type HackathonInput, hackathonSchema } from "@/lib/validations/portfolio";

import { DialogForm } from "../form/dialog-form";
import { Field } from "../form/field";
import { ImageUpload } from "../form/image-upload";
import { handleFormError } from "../form/server-errors";
import type { ResourceFormProps } from "../resource-manager";

export function HackathonForm({ item, submit, onCancel }: ResourceFormProps<HackathonDTO>) {
  const { register, control, handleSubmit, setError, formState } = useForm<HackathonInput>({
    resolver: zodResolver(hackathonSchema),
    defaultValues: {
      title: item?.title ?? "",
      location: item?.location ?? "",
      startDate: toInputDate(item?.startDate, "date"),
      endDate: toInputDate(item?.endDate, "date"),
      description: item?.description ?? "",
      image: item?.image ?? null,
      links: item?.links ?? [],
    },
    mode: "onTouched",
  });
  const { errors } = formState;
  const links = useFieldArray({ control, name: "links" });

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
        <Field label="Title" htmlFor="title" required error={errors.title?.message} className="sm:col-span-2">
          <Input id="title" autoFocus aria-invalid={!!errors.title} {...register("title")} />
        </Field>
        <Field label="Start" htmlFor="startDate" required error={errors.startDate?.message}>
          <Input id="startDate" type="date" aria-invalid={!!errors.startDate} {...register("startDate")} />
        </Field>
        <Field label="End" htmlFor="endDate" error={errors.endDate?.message}>
          <Input id="endDate" type="date" {...register("endDate")} />
        </Field>
        <Field label="Location" htmlFor="location" error={errors.location?.message} className="sm:col-span-2">
          <Input id="location" {...register("location")} />
        </Field>
      </div>
      <Field label="Logo / image">
        <Controller
          control={control}
          name="image"
          render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} folder="hackathons" />}
        />
      </Field>
      <Field label="Description" htmlFor="description" error={errors.description?.message}>
        <Textarea id="description" rows={3} {...register("description")} />
      </Field>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium">Links</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => links.append({ title: "", url: "" })}
            disabled={links.fields.length >= 10}
            className="gap-1"
          >
            <PlusIcon className="size-3.5" /> Add link
          </Button>
        </div>
        {links.fields.map((link, index) => (
          <div key={link.id} className="flex items-start gap-2">
            <div className="w-36">
              <Input
                placeholder="Title"
                aria-label={`Link ${index + 1} title`}
                aria-invalid={!!errors.links?.[index]?.title}
                {...register(`links.${index}.title`)}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="https://"
                aria-label={`Link ${index + 1} URL`}
                aria-invalid={!!errors.links?.[index]?.url}
                {...register(`links.${index}.url`)}
              />
              {(errors.links?.[index]?.url || errors.links?.[index]?.title) && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.links?.[index]?.title?.message ?? errors.links?.[index]?.url?.message}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-md"
              onClick={() => links.remove(index)}
              aria-label={`Remove link ${index + 1}`}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </DialogForm>
  );
}
