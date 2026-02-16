<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    /**
     * Log a custom activity.
     */
    public static function log(
        string $description,
        string $event = 'custom',
        ?Model $subject = null,
        array $properties = [],
        ?string $logName = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => Auth::id(),
            'log_name' => $logName ?? ($subject ? class_basename($subject) : 'System'),
            'description' => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject ? $subject->id : null,
            'event' => $event,
            'properties' => $properties,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Log a login activity.
     */
    public static function logLogin(): ActivityLog
    {
        return self::log('User logged in', 'login', Auth::user(), [], 'Authentication');
    }

    /**
     * Log a logout activity.
     */
    public static function logLogout(): ActivityLog
    {
        return self::log('User logged out', 'logout', Auth::user(), [], 'Authentication');
    }

    /**
     * Log a failed login attempt.
     */
    public static function logFailedLogin(string $email): ActivityLog
    {
        return ActivityLog::create([
            'user_id' => null,
            'log_name' => 'Authentication',
            'description' => 'Failed login attempt',
            'subject_type' => null,
            'subject_id' => null,
            'event' => 'failed_login',
            'properties' => ['email' => $email],
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
