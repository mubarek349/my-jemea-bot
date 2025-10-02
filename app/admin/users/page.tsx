"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userRegistrationSchema, UserRegistration } from "@/lib/zodSchema";
import { registerUser, deleteUser, toggleUserStatus, updateUser } from "@/actions/userRegistration";
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
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pending, startTransition] = useTransition();

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
      } else if (response.status === 401) {
        router.push('/login');
      } else if (response.status === 403) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneno?.includes(searchTerm)
  );

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const adminUsers = users.filter(u => u.isAdmin).length;

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
          toast.success(result.message);
          handleCloseModal();
          loadUsers(); // Reload users list
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error(isEditMode ? "Failed to update user" : "Failed to register user");
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingUser(null);
    reset();
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
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        toast.success(result.message);
        loadUsers();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const result = await toggleUserStatus(userId);
      if (result.success) {
        toast.success(result.message);
        loadUsers();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update user status");
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">
              Manage user accounts and monitor user activity across your bot.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary">
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>
            <button className="btn btn-secondary">
              Export
            </button>
            <Button
              onPress={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 px-6 py-2"
              startContent={
                <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                  <PlusIcon className="h-3 w-3" />
                </div>
              }
            >
              Add New User
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{totalUsers}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Active Users</div>
              <div className="stat-value">{activeUsers}</div>
            </div>
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Administrators</div>
              <div className="stat-value">{adminUsers}</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-50">
              <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-lg">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Users Table */}
      <div className="card-elevated">
        <div className="overflow-hidden">
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-1/4">User</th>
                    <th className="w-1/6">Username</th>
                    <th className="w-1/6">Role</th>
                    <th className="w-1/6">Status</th>
                    <th className="w-1/6">Joined</th>
                    <th className="w-1/6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {(user.firstName || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {user.firstName || "Unknown User"}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-900">
                          @{user.username || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.isAdmin ? (
                          <span className="badge badge-purple">
                            <ShieldCheckIcon className="h-3 w-3" />
                            Administrator
                          </span>
                        ) : (
                          <span className="badge badge-gray">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className="cursor-pointer transition-all duration-200 hover:scale-105"
                          title={`Click to ${user.isActive ? 'deactivate' : 'activate'} user`}
                        >
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200 shadow-sm hover:shadow-md transition-all duration-200">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                          {user.createdAt.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 rounded-lg"
                            title="Edit user"
                            onPress={() => handleEditUser(user)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg"
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
            <div className="empty-state">
              <UsersIcon className="empty-state-icon" />
              <h3 className="empty-state-title">No users found</h3>
              <p className="empty-state-description">
                {searchTerm ? "No users match your search criteria." : "No users have registered with your bot yet."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Registration Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-white",
          backdrop: "bg-black/50 backdrop-blur-sm",
          closeButton: "hover:bg-gray-100 active:bg-gray-200 transition-colors"
        }}
      >
        <ModalContent className="shadow-2xl border-0">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {isEditMode ? (
                    <PencilIcon className="w-5 h-5 text-white" />
                  ) : (
                    <UsersIcon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {isEditMode ? "Edit User" : "Add New User"}
                  </h2>
                  <p className="text-indigo-100 text-sm font-normal">
                    {isEditMode 
                      ? "Update user information" 
                      : "Create a new user account for your bot"
                    }
                  </p>
                </div>
              </div>
            </ModalHeader>
            
            <ModalBody className="px-8 py-8 space-y-8">
              {/* Form Section */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      First Name
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter first name"
                      {...register("firstName")}
                      isInvalid={!!errors.firstName}
                      errorMessage={errors.firstName?.message}
                      size="lg"
                      classNames={{
                        input: "text-gray-900 placeholder:text-gray-400",
                        inputWrapper: [
                          "bg-gray-50 border-2 border-gray-200 hover:border-indigo-300 focus-within:border-indigo-500",
                          "transition-all duration-200 ease-in-out",
                          "group-data-[focus=true]:bg-white",
                          "!cursor-text"
                        ]
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Last Name
                      <span className="text-gray-400 ml-1">(Optional)</span>
                    </label>
                    <Input
                      placeholder="Enter last name"
                      {...register("lastName")}
                      isInvalid={!!errors.lastName}
                      errorMessage={errors.lastName?.message}
                      size="lg"
                      classNames={{
                        input: "text-gray-900 placeholder:text-gray-400",
                        inputWrapper: [
                          "bg-gray-50 border-2 border-gray-200 hover:border-indigo-300 focus-within:border-indigo-500",
                          "transition-all duration-200 ease-in-out",
                          "group-data-[focus=true]:bg-white",
                          "!cursor-text"
                        ]
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Phone Number
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter phone number (e.g., +1234567890)"
                    {...register("phoneno")}
                    isInvalid={!!errors.phoneno}
                    errorMessage={errors.phoneno?.message}
                    size="lg"
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-gray-400 text-sm">📞</span>
                      </div>
                    }
                    classNames={{
                      input: "text-gray-900 placeholder:text-gray-400",
                      inputWrapper: [
                        "bg-gray-50 border-2 border-gray-200 hover:border-indigo-300 focus-within:border-indigo-500",
                        "transition-all duration-200 ease-in-out",
                        "group-data-[focus=true]:bg-white",
                        "!cursor-text"
                      ]
                    }}
                  />
                </div>
              </div>

              {/* Information Card */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 p-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        {isEditMode ? "User Information" : "Default User Settings"}
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        {isEditMode ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>Update user's personal information</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Changes will be saved immediately</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span>Chat ID and admin status cannot be changed here</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>User will be created as <strong>active</strong> by default</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>User role will be set to <strong>regular user</strong> (not administrator)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span>Chat ID will be set when they interact with the bot</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            
            <ModalFooter className="px-8 py-6 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="flex items-center justify-between w-full">
                <div className="text-xs text-gray-500">
                  All fields marked with <span className="text-red-500">*</span> are required
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="light"
                    onPress={handleCloseModal}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={pending}
                    className="px-8 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    startContent={!pending && (isEditMode ? <PencilIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />)}
                  >
                    {pending 
                      ? (isEditMode ? "Updating User..." : "Creating User...") 
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


