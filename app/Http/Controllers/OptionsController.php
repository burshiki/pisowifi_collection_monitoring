<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OptionsController extends Controller
{
    /**
     * Display the options page.
     */
    public function index()
    {
        $settings = [
            'system_name' => SystemSetting::get('system_name', 'PisoWiFi Collection Monitoring'),
            'system_logo' => SystemSetting::get('system_logo'),
        ];

        return Inertia::render('options/index', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update system settings.
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'system_name' => 'required|string|max:255',
            'system_logo' => 'nullable|image|max:2048', // 2MB max
        ]);

        SystemSetting::set('system_name', $request->system_name);

        if ($request->hasFile('system_logo')) {
            // Delete old logo if exists
            $oldLogo = SystemSetting::get('system_logo');
            if ($oldLogo) {
                Storage::disk('public')->delete($oldLogo);
            }

            // Store new logo
            $path = $request->file('system_logo')->store('logos', 'public');
            SystemSetting::set('system_logo', $path);
        }

        return back()->with('success', 'System settings updated successfully!');
    }

    /**
     * Remove system logo.
     */
    public function removeLogo()
    {
        $logo = SystemSetting::get('system_logo');
        if ($logo) {
            Storage::disk('public')->delete($logo);
            SystemSetting::set('system_logo', null);
        }

        return back()->with('success', 'Logo removed successfully!');
    }

    /**
     * Backup the database.
     */
    public function backup()
    {
        try {
            $driver = config('database.default');
            $backupPath = storage_path('app/backups');
            
            if (!file_exists($backupPath)) {
                mkdir($backupPath, 0755, true);
            }

            $filename = 'backup-' . date('Y-m-d-His');
            
            if ($driver === 'sqlite') {
                // For SQLite, just copy the database file
                $databasePath = config('database.connections.sqlite.database');
                $filename .= '.sqlite';
                $filepath = $backupPath . '/' . $filename;
                
                if (file_exists($databasePath)) {
                    copy($databasePath, $filepath);
                    return response()->download($filepath)->deleteFileAfterSend(false);
                }
                
                return back()->with('error', 'Database file not found at: ' . $databasePath);
            } else {
                // For MySQL
                $databaseName = config('database.connections.mysql.database');
                $username = config('database.connections.mysql.username');
                $password = config('database.connections.mysql.password');
                $host = config('database.connections.mysql.host');
                
                $filename .= '.sql';
                $filepath = $backupPath . '/' . $filename;

                $command = sprintf(
                    'mysqldump --user=%s --password=%s --host=%s %s > %s',
                    escapeshellarg($username),
                    escapeshellarg($password),
                    escapeshellarg($host),
                    escapeshellarg($databaseName),
                    escapeshellarg($filepath)
                );

                exec($command, $output, $returnVar);

                if ($returnVar === 0 && file_exists($filepath)) {
                    return response()->download($filepath)->deleteFileAfterSend(false);
                }

                return back()->with('error', 'Failed to create database backup. Please check your database configuration.');
            }
        } catch (\Exception $e) {
            return back()->with('error', 'Backup failed: ' . $e->getMessage());
        }
    }

    /**
     * Restore the database.
     */
    public function restore(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file|max:102400', // 100MB max
        ], [
            'backup_file.required' => 'Please select a backup file to restore.',
            'backup_file.file' => 'The selected file is invalid.',
            'backup_file.max' => 'The backup file must not be larger than 100MB.',
        ]);

        // Validate file extension manually
        $file = $request->file('backup_file');
        if ($file) {
            $extension = strtolower($file->getClientOriginalExtension());
            if (!in_array($extension, ['sql', 'sqlite'])) {
                return back()->withErrors([
                    'backup_file' => 'The backup file must be a .sql or .sqlite file. (Detected: .' . $extension . ')'
                ])->withInput();
            }
        }

        try {
            $driver = config('database.default');
            
            Log::info('Database restore started', ['driver' => $driver]);
            
            if ($driver === 'sqlite') {
                // For SQLite, replace the database file
                $databasePath = config('database.connections.sqlite.database');
                Log::info('SQLite restore', ['path' => $databasePath]);
                
                // Backup current database first
                $backupBeforeRestore = $databasePath . '.before_restore';
                if (file_exists($backupBeforeRestore)) {
                    @unlink($backupBeforeRestore);
                }
                
                if (file_exists($databasePath)) {
                    if (!copy($databasePath, $backupBeforeRestore)) {
                        Log::error('Failed to create safety backup');
                        return back()->with('error', 'Failed to create safety backup.');
                    }
                    Log::info('Safety backup created');
                }
                
                // Close all database connections and purge
                DB::disconnect();
                DB::purge();
                Log::info('Database connections closed');
                
                // Give time for file handles to release
                usleep(500000); // 500ms - increased for Windows
                
                // Delete old database file
                if (file_exists($databasePath)) {
                    if (!@unlink($databasePath)) {
                        Log::error('Failed to delete old database', ['path' => $databasePath]);
                        return back()->with('error', 'Failed to remove old database file. It may be locked by another process. Please close any database connections and try again.');
                    }
                    Log::info('Old database file deleted');
                }
                
                // Copy new database file
                $uploadedPath = $file->path();
                Log::info('Copying new database', ['from' => $uploadedPath, 'to' => $databasePath]);
                
                if (!copy($uploadedPath, $databasePath)) {
                    Log::error('Failed to copy new database file');
                    // Restore the backup if copy failed
                    if (file_exists($backupBeforeRestore)) {
                        copy($backupBeforeRestore, $databasePath);
                        Log::info('Restored safety backup after failed copy');
                    }
                    return back()->with('error', 'Failed to copy new database file.');
                }
                
                Log::info('New database copied successfully');
                
                // Reconnect to database
                DB::reconnect();
                Log::info('Database reconnected');
                
                // Clean up backup
                if (file_exists($backupBeforeRestore)) {
                    @unlink($backupBeforeRestore);
                }
                
                Log::info('Database restore completed successfully');
                return back()->with('success', 'Database restored successfully!');
            } else {
                // For MySQL
                $path = $file->storeAs('backups', 'restore-' . time() . '.sql');
                $filepath = storage_path('app/' . $path);

                $databaseName = config('database.connections.mysql.database');
                $username = config('database.connections.mysql.username');
                $password = config('database.connections.mysql.password');
                $host = config('database.connections.mysql.host');

                $command = sprintf(
                    'mysql --user=%s --password=%s --host=%s %s < %s',
                    escapeshellarg($username),
                    escapeshellarg($password),
                    escapeshellarg($host),
                    escapeshellarg($databaseName),
                    escapeshellarg($filepath)
                );

                exec($command, $output, $returnVar);

                // Clean up temporary file
                unlink($filepath);

                if ($returnVar === 0) {
                    return back()->with('success', 'Database restored successfully!');
                }

                return back()->with('error', 'Failed to restore database. Please check your backup file.');
            }
        } catch (\Exception $e) {
            Log::error('Database restore exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Restore failed: ' . $e->getMessage());
        }
    }

    /**
     * List available backups.
     */
    public function listBackups()
    {
        $backupPath = storage_path('app/backups');
        if (!file_exists($backupPath)) {
            return response()->json([]);
        }

        $files = array_diff(scandir($backupPath), ['.', '..']);
        $backups = [];

        foreach ($files as $file) {
            $extension = pathinfo($file, PATHINFO_EXTENSION);
            if (in_array($extension, ['sql', 'sqlite'])) {
                $filepath = $backupPath . '/' . $file;
                $backups[] = [
                    'filename' => $file,
                    'size' => filesize($filepath),
                    'date' => date('Y-m-d H:i:s', filemtime($filepath)),
                ];
            }
        }

        // Sort by date descending
        usort($backups, function ($a, $b) {
            return strcmp($b['date'], $a['date']);
        });

        return response()->json($backups);
    }

    /**
     * Download a specific backup.
     */
    public function downloadBackup($filename)
    {
        $filepath = storage_path('app/backups/' . $filename);
        
        if (!file_exists($filepath)) {
            return back()->with('error', 'Backup file not found.');
        }

        return response()->download($filepath);
    }

    /**
     * Delete a specific backup.
     */
    public function deleteBackup($filename)
    {
        $filepath = storage_path('app/backups/' . $filename);
        
        if (file_exists($filepath)) {
            unlink($filepath);
            return back()->with('success', 'Backup deleted successfully!');
        }

        return back()->with('error', 'Backup file not found.');
    }
}
