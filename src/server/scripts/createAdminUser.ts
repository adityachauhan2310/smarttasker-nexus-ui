
import { supabaseAdmin } from '../config/database';
import bcrypt from 'bcrypt';

const createAdminUser = async () => {
  try {
    console.log('Creating admin user in Supabase...');

    // Check if admin user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const existingAdmin = existingUsers.users.find(user => user.email === 'admin@smarttasker.ai');
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      
      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAdmin.id,
        { password: '2025@Aditya' }
      );
      
      if (updateError) {
        console.error('Error updating admin password:', updateError);
      } else {
        console.log('Admin password updated successfully');
      }
      return;
    }

    // Create admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@smarttasker.ai',
      password: '2025@Aditya',
      email_confirm: true,
      user_metadata: {
        name: 'System Administrator',
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Error creating admin user:', authError);
      return;
    }

    console.log('Admin user created successfully:');
    console.log('Email: admin@smarttasker.ai');
    console.log('Password: 2025@Aditya');
    console.log('User ID:', authData.user.id);

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Run the script
createAdminUser();
