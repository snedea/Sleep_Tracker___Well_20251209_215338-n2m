import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/Header';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmModal } from '@/components/ui/Modal';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile, deleteAccount, isLoading } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateProfile({ name, email });
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await updateProfile({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSuccess('Password changed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account" />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Profile Settings */}
      <Card>
        <CardHeader title="Profile" />
        <CardBody>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" isLoading={isLoading}>
              Update Profile
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader title="Change Password" />
        <CardBody>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="At least 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            <Button type="submit" isLoading={isLoading}>
              Change Password
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader title="About" />
        <CardBody className="space-y-2 text-sm text-gray-600">
          <p><span className="font-medium">Version:</span> 1.0.0</p>
          <p><span className="font-medium">Last Sync:</span> Just now</p>
          <p className="text-xs text-gray-400">
            Sleep Tracker & Wellness Diary helps you understand the connection
            between your sleep patterns and daily well-being.
          </p>
        </CardBody>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader title="Account" />
        <CardBody className="space-y-4">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full"
          >
            Sign Out
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="w-full"
          >
            Delete Account
          </Button>
        </CardBody>
      </Card>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
        confirmText="Delete Account"
        variant="danger"
      />
    </div>
  );
}
