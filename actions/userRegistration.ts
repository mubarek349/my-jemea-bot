"use server"

import { prisma } from "@/lib/db";
import { userRegistrationSchema, UserRegistration } from "@/lib/zodSchema";

type RegistrationResult = 
  | { success: true; message: string; userId: string }
  | { success: false; message: string; field?: keyof UserRegistration };

export async function registerUser(data: UserRegistration): Promise<RegistrationResult> {
  try {
    console.log('Registering user with data:', data);
    
    // Validate the input data
    const validationResult = userRegistrationSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      if (!firstError) {
        return {
          success: false,
          message: "Validation failed",
        };
      }
      console.log('Validation failed:', firstError.message);
      return {
        success: false,
        message: firstError.message || "Validation failed",
        field: firstError.path?.[0] as keyof UserRegistration
      };
    }

    const validatedData = validationResult.data;
    console.log('Data validated successfully');

    // Check if phone number already exists
    const existingPhoneUser = await prisma.user.findFirst({
      where: { phoneno: validatedData.phoneno }
    });

    if (existingPhoneUser) {
      console.log('Phone number already exists');
      return {
        success: false,
        message: "User with this phone number already exists",
        field: "phoneno"
      };
    }

    // Create the new user
    console.log('Creating new user...');
    const newUser = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || null,
        phoneno: validatedData.phoneno,
        isAdmin: false,
        isActive: true,
      }
    });
    console.log('User created successfully:', newUser.id);

    return {
      success: true,
      message: "User registered successfully",
      userId: newUser.id
    };

  } catch (error) {
    console.error("Error registering user:", error);
    return {
      success: false,
      message: "Failed to register user. Please try again."
    };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Deleting user:', userId);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log('User deleted successfully');
    return {
      success: true,
      message: "User deleted successfully"
    };

  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: "Failed to delete user. Please try again."
    };
  }
}

export async function updateUser(userId: string, data: UserRegistration): Promise<RegistrationResult> {
  try {
    console.log('Updating user:', userId, 'with data:', data);
    
    // Validate the input data
    const validationResult = userRegistrationSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      if (!firstError) {
        return {
          success: false,
          message: "Validation failed",
        };
      }
      return {
        success: false,
        message: firstError.message || "Validation failed",
        field: firstError.path?.[0] as keyof UserRegistration
      };
    }

    const validatedData = validationResult.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return { success: false, message: "User not found" };
    }

    // Check if phone number is being changed and already exists for another user
    if (validatedData.phoneno !== existingUser.phoneno) {
      const existingPhoneUser = await prisma.user.findFirst({
        where: { 
          phoneno: validatedData.phoneno,
          id: { not: userId }
        }
      });

      if (existingPhoneUser) {
        return {
          success: false,
          message: "User with this phone number already exists",
          field: "phoneno"
        };
      }
    }

    // Update the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || null,
        phoneno: validatedData.phoneno,
      }
    });

    console.log('User updated successfully');
    return {
      success: true,
      message: "User updated successfully",
      userId: userId
    };

  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      message: "Failed to update user. Please try again."
    };
  }
}

