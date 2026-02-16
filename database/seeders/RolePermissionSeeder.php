<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Dashboard permissions
            'view dashboard',
            
            // WiFi Vendo permissions
            'view wifi vendos',
            'create wifi vendos',
            'update wifi vendos',
            'delete wifi vendos',
            'add wifi vendo collections',
            'delete wifi vendo collections',
            
            // Audit permissions
            'view audit collections',
            
            // Activity Log permissions
            'view activity logs',
            
            // User management permissions
            'view users',
            'create users',
            'edit users',
            'delete users',
            'assign roles',
            
            // Options permissions
            'manage system options',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->syncPermissions(Permission::all());

        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $managerRole->syncPermissions([
            'view dashboard',
            'view wifi vendos',
            'create wifi vendos',
            'update wifi vendos',
            'add wifi vendo collections',
            'delete wifi vendo collections',
        ]);

        $collectorRole = Role::firstOrCreate(['name' => 'collector']);
        $collectorRole->syncPermissions([
            'view dashboard',
            'view wifi vendos',
            'add wifi vendo collections',
        ]);

        $auditorRole = Role::firstOrCreate(['name' => 'auditor']);
        $auditorRole->syncPermissions([
            'view dashboard',
            'view audit collections',
            'update wifi vendos',
        ]);

        // Assign admin role to the first user (test user)
        $user = User::first();
        if ($user) {
            $user->assignRole('admin');
        }
    }
}

