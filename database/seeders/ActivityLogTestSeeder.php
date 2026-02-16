<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\WifiVendo;
use Illuminate\Database\Seeder;

class ActivityLogTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        $vendo = WifiVendo::first();

        if (!$user) {
            $this->command->warn('No users found. Please seed users first.');
            return;
        }

        // Sample login activity
        ActivityLog::create([
            'user_id' => $user->id,
            'log_name' => 'Authentication',
            'description' => 'User logged in',
            'event' => 'login',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'created_at' => now()->subHours(5),
        ]);

        // Sample failed login
        ActivityLog::create([
            'user_id' => null,
            'log_name' => 'Authentication',
            'description' => 'Failed login attempt',
            'event' => 'failed_login',
            'properties' => ['email' => 'wrong@example.com'],
            'ip_address' => '192.168.1.100',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'created_at' => now()->subHours(4),
        ]);

        if ($vendo) {
            // Sample vendo created activity
            ActivityLog::create([
                'user_id' => $user->id,
                'log_name' => 'WifiVendo',
                'description' => 'Created WifiVendo',
                'subject_type' => WifiVendo::class,
                'subject_id' => $vendo->id,
                'event' => 'created',
                'properties' => ['name' => $vendo->name],
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => now()->subHours(3),
            ]);

            // Sample vendo updated activity
            ActivityLog::create([
                'user_id' => $user->id,
                'log_name' => 'WifiVendo',
                'description' => 'Updated WifiVendo',
                'subject_type' => WifiVendo::class,
                'subject_id' => $vendo->id,
                'event' => 'updated',
                'properties' => [
                    'old' => ['name' => 'Old Name'],
                    'new' => ['name' => $vendo->name],
                ],
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => now()->subHours(2),
            ]);
        }

        // Sample logout activity
        ActivityLog::create([
            'user_id' => $user->id,
            'log_name' => 'Authentication',
            'description' => 'User logged out',
            'event' => 'logout',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'created_at' => now()->subHours(1),
        ]);

        $this->command->info('Sample activity logs created successfully!');
    }
}
