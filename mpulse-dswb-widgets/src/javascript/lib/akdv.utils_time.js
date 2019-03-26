;((window, document) => {

    'use strict';

    window.akdv.utils_time = {
    
        // ------------ DATETIME METHODS ------------
        millisecondsToDateAtoms(datetime, timeZone, locale, hour12) {
    
            /**
             * Accepts a milliseconds since epoch timestamp, timezone and locale
             * provides an object, containing time atoms (day, month, year etc), based on the provided values 
             */
            
            if( $.type(datetime) !== 'number' )
            {
                window._log.error('An invalied TIMEZONE argument was passed. Defaulting to "UTC"');
                return '--';
            }

            //timeZone = 'UTC';
            //timeZone = 'Europe/London';
            //timeZone = 'America/New_York';
            //timeZone = 'Asia/Shanghai';
            //timeZone = 'Asia/Kolkata';

            // Check the Timezone is valid
            if( $.type(timeZone) === 'string' )
            { 
                try {
                    new Date().toLocaleDateString('en-US', { 'timeZone': timeZone, 'hour12': hour12, 'day': 'numeric'  });
                } catch (err) {
                    // An invalid Timezone argument was passed
                    window._log.error('An invalied TIMEZONE argument was passed.');
                }
            }
            else
            {
                window._log.warn('No TIMEZONE argument was passed. Defaulting to "UTC"');
                timeZone = 'UTC';
            }
            
            // Check the Locale is valid
            if( $.type(locale) === 'string' )
            {
                try {
                    Intl.getCanonicalLocales(locale);
                } catch (err) {
                    // If a non-canonical LOCALE is defined, default to English US
                    window._log.error('A non-canonical LOCALE of "' + locale + '" was defined.');
                }
            }
            else
            {
                // If no LOCALE is defined, default to English US
                window._log.warn('No LOCALE was defined. Defaulting to "en-US"');
                locale = 'en-US'; 
            }
            
            // Ensure 12hour/24hour behaviour is defined
            if( $.type(hour12) !== 'boolean' )
            {
                hour12 = false;
            }
            
            
            let newDate = new Date(datetime);

            // Gather Date atoms
            let day = parseInt(newDate.toLocaleDateString(locale, { 'timeZone': timeZone, 'hour12': hour12, 'day': 'numeric'  }));
            let month = newDate.toLocaleDateString(locale, { 'timeZone': timeZone, 'hour12': hour12, 'month': 'numeric'  });
            let monthName = newDate.toLocaleDateString(locale, { 'timeZone': timeZone, 'hour12': hour12, 'month': 'long'  });
            let year = parseInt(newDate.toLocaleDateString(locale, { 'timeZone': timeZone, 'hour12': hour12, 'year': 'numeric'  }));
            
            // Determine what the day postfix should be i.e. 2nd, 3rd, 4th etc
            let dayPostFix = window.akdv.utils_string.getOrdinalSuffix(day);
            
            let dateTimeAtoms = newDate.toLocaleDateString(locale, { 'timeZone': timeZone, 'hour12': hour12, hour: '2-digit', minute: '2-digit' , second: '2-digit' }).split(' ');
            let timeString = dateTimeAtoms[1];
            
            let twelveHourPostfix = '';
            if(hour12)
            {
                let twelveHourPostfix = dateTimeAtoms[2].toLowerCase();
            }
            
            let timeAtoms = timeString.split(':');

            let hour = timeAtoms[0];
            let minute = timeAtoms[1];
            let second = timeAtoms[2];
            
            let result = {
                day,
                month,
                monthName,
                year,
                hour,
                minute,
                second,
                dayPostFix,
                twelveHourPostfix
            }
            
            return result;
        },
        
        
        datetimeToString(datetime) {
        
            /**
             * Formats a milliseconds since epoch number
             * Displays date-time ms values e.g 27th April 2018 at 12:12pm
             */
            
            let timeString = '--';
            
            if( $.type(datetime) === 'number' )
            {
                let d = this.millisecondsToDateAtoms(datetime);
                timeString = d.day + d.dayPostFix + " " + d.monthName + " " + d.year + " at " + d.hour + ":" + d.minute + d.twelveHourPostfix;
            }
    
            return timeString;
        },
        
        
        // ------------ DURATION METHODS ------------
        
        millisecondsToDuration(milliseconds) {
    
            let totalMilliSeconds = milliseconds;
            let totalSeconds = milliseconds / 1000;
            let totalMinutes = totalSeconds / 60;
            let totalHours = totalSeconds / 3600;
            let totalDays = totalSeconds / 86400;
            
            let days = Math.floor(totalDays);
            let hours   = Math.floor(totalHours) - (days * 24);
            let minutes = Math.floor(totalMinutes - (hours * 60) - (days * 1440));
            let seconds = Math.floor(totalSeconds - (minutes * 60) - (hours * 3600) - (days * 86400));
            let milliSeconds = totalMilliSeconds - (seconds * 1000) - (minutes * 60000) - (hours * 3600000) - (days * 86400000);
            
            let result = {
                days,
                hours,
                minutes,
                seconds,
                milliSeconds
            };
            
            return result;
        },
        
        
        durationToHMSWords(milliseconds) {
            
            /**
             * Formats a millisecond duration number
             * Shows two significant values for the duration, e.g. days y, or hours x, minutes y
             */
    
            if( $.type(milliseconds) === 'number' )
            {
                let duration = this.millisecondsToDuration(milliseconds);
    
                // Lets get our plurality right!
                const psfxDays = (duration.days > 1 || duration.days === 0) ? ' days' : ' day';
                const psfxHours = (duration.hours > 1 || duration.hours === 0) ? ' hours' : ' hour';
                const psfxMinutes = (duration.minutes > 1 || duration.minutes === 0) ? ' minutes' : ' minute';
                const psfxSeconds = (duration.seconds > 1 || duration.seconds === 0) ? ' seconds' : ' second';
    
    //                    window._log.debug( milliseconds + 
    //                            ' = ' + duration.days + psfxDays + 
    //                            ', ' + duration.hours + psfxHours + 
    //                            ', ' + duration.minutes + psfxMinutes + 
    //                            ', ' + duration.seconds + psfxSeconds
    //                            );
                
                let dString = '--';
                
                if( duration.days > 0 )
                {
                    dString = duration.days + psfxDays+ ', ' + duration.hours + psfxHours;
                }
                else if( duration.hours > 0 )
                {
                    dString = duration.hours + psfxHours + ', ' + duration.minutes + psfxMinutes;
                }
                else if( duration.minutes > 0 )
                {
                    dString = duration.minutes + psfxMinutes + ', ' + duration.seconds + psfxSeconds;
                }
                else
                {
                    dString = duration.seconds + psfxSeconds;
                }
                
                return dString;
            }
            else
            {
                return '--';
            }
        },
    
        
        durationToHMSDigits(milliseconds) {
            
            /**
             * Formats a millisecond duration number to Hours:Minutes:Seconds
             * 
             */
    
            if( $.type(milliseconds) === 'number' )
            {
                let duration = this.millisecondsToDuration(milliseconds);
                return duration.hours + ":" + duration.minutes + ":" + duration.seconds;
            }
            else
            {
                return '00:00:00';
            }
        }
    };


})(window, document);