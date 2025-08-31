// utils/validation.ts
import { Student } from "@/types/student"

export const validateStudent = (data: Student): string[] => {
  const errors: string[] = []

  const { name, email, phone, address, status } = data

  console.log("Validating student data, validate method done:", data)

  // Name validation
  if (!name.trim()) errors.push("Name is required")
  else if (name.trim().length < 2) errors.push("Name must be at least 2 characters")

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.trim()) errors.push("Email is required")
  else if (!emailRegex.test(email)) errors.push("Invalid email format")

  // Phone validation (10 digits)
  const phoneRegex = /^[0-9]{10}$/
  if (!phone.trim()) errors.push("Phone number is required")
  else if (!phoneRegex.test(phone)) errors.push("Invalid phone number")

  // Address validation
  if (!address.trim()) errors.push("Address is required")
  else if (address.trim().length < 5) errors.push("Address must be at least 5 characters")

  // Status validation (active / inactive)
  if (!status.trim()) errors.push("Status is required")
  else if (!["active", "inactive"].includes(status.toLowerCase()))
    errors.push("Status must be either 'active' or 'inactive'")

  return errors
}
