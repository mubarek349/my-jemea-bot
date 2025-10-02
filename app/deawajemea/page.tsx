"use client";

import { useState, useEffect, useTransition } from "react";
import {
  UsersIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userRegistrationSchema, UserRegistration } from "@/lib/zodSchema";
import { registerUser, deleteUser, updateUser } from "@/actions/userRegistration";
import { toast } from "react-hot-toast";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  phoneno: string | null;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<UserRegistration>({
    resolver: zodResolver(userRegistrationSchema)
  });

  // Load users data
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt)
        })));
        
        // Show success message only if there are users
        if (data.length > 0) {
          toast.success(`✅ Loaded ${data.length} user${data.length === 1 ? '' : 's'} successfully`, {
            duration: 2000,
            style: {
              background: '#10b981',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
            },
          });
        } else {
          toast('📝 No users found. Click "Add User" to get started!', {
            duration: 3000,
            style: {
              background: '#3b82f6',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
            },
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`❌ Failed to load users: ${errorData.error || 'Unknown error'}`, {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('🌐 Network error. Please check your connection and try again.', {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
        },
      });
    } finally {
      setLoading(false);
    }
  };


  const onSubmit = (data: UserRegistration) => {
    startTransition(async () => {
      try {
        let result;
        if (isEditMode && editingUser) {
          result = await updateUser(editingUser.id, data);
        } else {
          result = await registerUser(data);
        }
        
        if (result.success) {
          toast.success(`🎉 ${result.message}`, {
            duration: 4000,
            style: {
              background: '#10b981',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
            },
          });
          handleCloseModal();
          loadUsers();
        } else {
          const errorMessage = result.message || (isEditMode ? "Failed to update user" : "Failed to register user");
          toast.error(`❌ ${errorMessage}`, {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
            },
          });
        }
      } catch (error) {
        console.error('Registration error:', error);
        toast.error(`💥 ${isEditMode ? "Failed to update user" : "Failed to register user"}. Please try again.`, {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        });
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingUser(null);
    reset();
  };

  const handleOpenAddModal = () => {
    setIsModalOpen(true);
    setIsEditMode(false);
    setEditingUser(null);
    reset();
    
    // Show add user notification
    toast('➕ Adding new user', {
      duration: 2000,
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditMode(true);
    setIsModalOpen(true);
    // Pre-fill the form with user data
    reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneno: user.phoneno || "",
    });
    
    // Show edit notification
    toast(`✏️ Editing ${user.firstName} ${user.lastName || ''}`, {
      duration: 2000,
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    const userName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User';
    
    if (!confirm(`🗑️ Are you sure you want to delete "${userName}"? This action cannot be undone.`)) return;
    
    setDeletingUserId(userId);
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        toast.success(`✅ ${result.message}`, {
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        });
        loadUsers();
      } else {
        toast.error(`❌ ${result.message}`, {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('💥 Failed to delete user. Please try again.', {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
        },
      });
    } finally {
      setDeletingUserId(null);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Registered Users</h1>
        <Button
          onPress={handleOpenAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2"
          startContent={<PlusIcon className="h-4 w-4" />}
        >
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="overflow-hidden">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                            {(user.firstName || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.phoneno || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isAdmin 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {user.isAdmin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            className="text-gray-400 hover:text-indigo-600"
                            title="Edit user"
                            onPress={() => handleEditUser(user)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            isLoading={deletingUserId === user.id}
                            isDisabled={deletingUserId === user.id}
                            className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                            onPress={() => handleDeleteUser(user.id)}
                            title="Delete user"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new user.</p>
            </div>
          )}
        </div>
      </div>

      {/* User Registration Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        size="lg"
        scrollBehavior="inside"
        classNames={{
          base: "bg-white",
          backdrop: "bg-black/50 backdrop-blur-sm",
          closeButton: "hover:bg-gray-100 active:bg-gray-200 transition-colors"
        }}
      >
        <ModalContent className="shadow-xl border-0">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <ModalHeader className="flex flex-col gap-1 bg-indigo-600 text-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  {isEditMode ? (
                    <PencilIcon className="w-4 h-4 text-white" />
                  ) : (
                    <UsersIcon className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {isEditMode ? "Edit User" : "Add New User"}
                  </h2>
                  <p className="text-indigo-100 text-sm">
                    {isEditMode 
                      ? "Update user information" 
                      : "Create a new user account"
                    }
                  </p>
                </div>
              </div>
            </ModalHeader>
            
            <ModalBody className="px-6 py-6 space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter first name"
                      {...register("firstName", {
                        required: "First name is required",
                        minLength: {
                          value: 2,
                          message: "First name must be at least 2 characters"
                        },
                        maxLength: {
                          value: 50,
                          message: "First name must be less than 50 characters"
                        }
                      })}
                      isInvalid={!!errors.firstName}
                      errorMessage={errors.firstName?.message}
                      size="md"
                      classNames={{
                        input: "text-gray-900 placeholder:text-gray-400",
                        inputWrapper: [
                          "border border-gray-300 hover:border-indigo-400 focus-within:border-indigo-500",
                          "transition-colors duration-200"
                        ]
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Last Name <span className="text-gray-400">(Optional)</span>
                    </label>
                    <Input
                      placeholder="Enter last name"
                      {...register("lastName", {
                        maxLength: {
                          value: 50,
                          message: "Last name must be less than 50 characters"
                        }
                      })}
                      isInvalid={!!errors.lastName}
                      errorMessage={errors.lastName?.message}
                      size="md"
                      classNames={{
                        input: "text-gray-900 placeholder:text-gray-400",
                        inputWrapper: [
                          "border border-gray-300 hover:border-indigo-400 focus-within:border-indigo-500",
                          "transition-colors duration-200"
                        ]
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter phone number (e.g., +1234567890)"
                    {...register("phoneno", {
                      required: "Phone number is required",
                      pattern: {
                        value: /^\+?[0-9]{10,15}$/,
                        message: "Please enter a valid phone number (10-15 digits, optionally starting with +)"
                      }
                    })}
                    isInvalid={!!errors.phoneno}
                    errorMessage={errors.phoneno?.message}
                    size="md"
                    classNames={{
                      input: "text-gray-900 placeholder:text-gray-400",
                      inputWrapper: [
                        "border border-gray-300 hover:border-indigo-400 focus-within:border-indigo-500",
                        "transition-colors duration-200"
                      ]
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Format: +1234567890 or 1234567890 (10-15 digits)
                  </p>
                </div>
              </div>

            </ModalBody>
            
            <ModalFooter className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between w-full">
                <div className="text-xs text-gray-500">
                  Fields marked with <span className="text-red-500">*</span> are required
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="light"
                    onPress={handleCloseModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={pending}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                    startContent={!pending && (isEditMode ? <PencilIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />)}
                  >
                    {pending 
                      ? (isEditMode ? "Updating..." : "Creating...") 
                      : (isEditMode ? "Update User" : "Create User")
                    }
                  </Button>
                </div>
              </div>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}


