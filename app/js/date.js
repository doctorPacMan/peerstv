"use strict";
var iDate = function() {return this.initialize.apply(this,arguments)};
iDate.prototype = {
	initialize: function() {
		var args = Array.prototype.slice.call(arguments),
			date = new (Date.bind.apply(Date,[null].concat(args)))();
    	return date;
	}
};
Date.prototype.timeoffset = 0;
Date.current = function() {
	var offset = (Date.prototype.timeoffset || 0),
		args = Array.prototype.slice.call(arguments),
		date = new (Date.bind.apply(Date,[null].concat(args)))();
	date.setMilliseconds(date.getMilliseconds() + offset);
   	return date;
};

Date.json = function(json) {
	var date = new Date();
	date.setFullYear(json.year,json.month-1,json.day);
	date.setHours(json.hour,json.minute,json.second,0);
   	return date;
};
Date.prototype.iso = function() {
// ISO8601 new Date('1998-02-01T00:00:00+07:00');
	var offset = this.getTimezoneOffset(),
		tzs = Math.abs(offset),
		tzh = Math.ceil(tzs/60),
		tzm = (tzs%60);

	var tz = (offset<0 ? '+' : '-')+(tzh<10?'0'+tzh:tzh)+':'+(tzm<10?'0'+tzm:tzm);
	return this.format('yyyy-mm-ddTh:nn:ss') + tz;
};
Date.prototype.rfc = function() {
// RFC2822 new Date('Sun Feb 01 1998 00:00:00 GMT+0700');
	var dw = this.getNames(this.getDay(),'day_abbr','en'),
		dm = this.getNames(this.getMonth(),'short','en'),
		offset = this.getTimezoneOffset(),
		tzs = Math.abs(offset),
		tzh = Math.ceil(tzs/60),
		tzm = (tzs%60);

	var tz = (offset<0 ? '+' : '-') + (tzh<10?'0'+tzh:tzh) + (tzm<10?'0'+tzm:tzm);
	return dw+' '+dm+' '+this.format('dd yyyy h:nn:ss')+' GMT' + tz;
	//var o = {hour12:false,weekday:'short',year:'numeric',month:'short'};
	//console.log(this.toLocaleString('en-US',o));
	//console.log(this.toLocaleString('ru-RU',o));
};
Date.prototype.getNames = function(n, t, l) {
	var names = {
			'ru': {
				short: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
				title: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
				label: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
				day_short: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
				day_abbr: ['Вск', 'Пнд', 'Втр', 'Срд', 'Чтв', 'Птн', 'Сбт'],
				day_full: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
			},
			'en': {
				short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
				title: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				label: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
				day_short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
				day_abbr: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
				day_full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
			}
		},
		l = l || (navigator.language==='ru-RU'?'ru':'en'),
		n = typeof(n)=='number' ? n : 0,
		t = names[l][t] ? t : 'short';
	return names[l][t][n];
}
Date.prototype.getMonthShort = function(n) {return this.getNames(n,'short')};
Date.prototype.getMonthTitle = function(n) {return this.getNames(n,'title')};
Date.prototype.getMonthLabel = function(n) {return this.getNames(n,'label')};
Date.prototype.getDayNames = function(n) {return this.getNames(n,'day_short')};
Date.prototype.getDayFullNames = function(n) {return this.getNames(n,'day_full')};
Date.prototype.getAge = function(now) {
	var zf = function(n){return n<10 ? ('0'+n) : n},
		plrl = function(n,s1,s2,s5){
			var k=Math.abs(n)%100,v=k%10,s;
			if(k>10&&k<20) return (s5||'');
			if(v>1&&v<5) return (s2||'');
			if(v==1) return (s1||'');
			return (s5||'');
		},
		now = now?new Date(now):new Date(),
		age = now.getTime()-this.getTime(),
		age_s = Math.abs(Math.floor((now - this)/1000)),
		age_m = Math.floor(age_s/60),
		age_h = Math.round(age_m/60),
		day = new Date(this).setHours(0,0,0,0),
		dtime = zf(this.getHours())+':'+zf(this.getMinutes()),
		dyear = this.getFullYear(),
		ddate = this.getDate()+' '+this.getMonthLabel()+(dyear==now.getFullYear() ? '' : (' '+dyear)),
		txt_s = (age_s>1 ? age_s+' ' : '')+'секунд'+plrl(age_s,'у','ы'),
		txt_m = (age_m>1 ? age_m+' ' : '')+'минут'+plrl(age_m,'у','ы'),
		txt_h = (age_h>1 ? age_h+' ' : '')+'час'+plrl(age_h,'','а','ов'),
		dtext = dtext = ddate+' в '+dtime;

	if(age_s<15) dtext = age>0 ? 'только что' : 'прямо сейчас';
	else if(age_s<60) dtext = age>0 ? (txt_s+' назад') : ('через '+txt_s);
	else if(age_m<60) dtext = age>0 ? (txt_m+' назад') : ('через '+txt_m);
	else if(age_h<12) dtext = age>0 ? (txt_h+' назад') : ('через '+txt_h);
	else if(day==new Date(now).setHours(0,0,0,0)) dtext = 'сегодня в '+dtime;
	else if(day==new Date(now).setHours(24,0,0,0)) dtext = 'завтра в '+dtime;
	else if(day==new Date(now).setHours(-24,0,0,0)) dtext = 'вчера в '+dtime;

	return dtext;
};
Date.prototype.formatHeader = function() {
	var dt = this;
	dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());// GMT
	var df = dt.getNames(dt.getDay(),'day_abbr','en')+', '+dt.getDate();
	df+= ' '+dt.getNames(dt.getMonth(),'short','en');
	df+= ' '+dt.format('yyyy h:nn:ss')+' GMT';
	return df;
};
Date.prototype.getHtmlTime = function() {

	var zf = function(n){return n<10 ? ('0'+n) : n},
		dt = this,
		tz = dt.getTimezoneOffset();
	
	var dt_datetime = '',
		dt_time = zf(dt.getHours())+':'+zf(dt.getMinutes())+':'+zf(dt.getSeconds()),
		dt_date = dt.getFullYear()+'-'+zf(dt.getMonth()+1)+'-'+zf(dt.getDate()),
		dt_zone = Math.abs(tz),
		dt_zone = zf(Math.ceil(dt_zone/60))+zf(dt_zone%60),
		dt_zone = (tz<0?'+':'-') + dt_zone;
	
	// dt_time += '.'+dt.getMilliseconds();
	dt_datetime = dt_date+'T'+dt_time+dt_zone;
	return dt_datetime;
};
Date.prototype.format = function(f) {
    
    if (!this.valueOf()) return '&nbsp;';
    if (!f) f = "yyyy-mm-dd";

    var d = this;
    var zf = function(n) {	return (n>9) ? (n) : ("0"+n) };

	var getOffsetFromUTC = function(d) {
		var offset = d.getTimezoneOffset();
		return ((offset < 0 ? '+' : '-')
		+ zf(Math.abs(offset / 60), 2)
		+ zf(Math.abs(offset % 60), 2))
	};

	//@todo: fix to http://msdn.microsoft.com/ru-ru/library/8kb3ddd4(v=vs.110).aspx
    return f.replace(/(yyyy|mmru|mmmm|mmm|mm|dddd|ddd|dd|d|hh|h|nn|ss|ms|a\/p|tz)/gi,
        function($1)
        {
            switch ($1.toLowerCase())
            {
            case 'yyyy': return d.getFullYear();
			case 'mmru': return d.getMonthTitle(d.getMonth());
            case 'mmmm': return d.getMonthLabel(d.getMonth());
            case 'mmm':  return d.getMonthShort(d.getMonth());
            case 'mm':   return zf(d.getMonth()+1);
            case 'dddd': return d.getDayFullNames(d.getDay());
            case 'ddd':  return d.getDayNames(d.getDay());
            case 'dd':   return zf(d.getDate());
            case 'd':    return d.getDate();
            case 'hh':   return zf(((h = d.getHours() % 12) ? h : 12));
            case 'h':    return zf(d.getHours());
            case 'nn':   return zf(d.getMinutes());
            case 'ss':   return zf(d.getSeconds());
            case 'ms':   return d.getMilliseconds();
            case 'a/p':  return d.getHours() < 12 ? 'a' : 'p';
	        case 'tz':   return getOffsetFromUTC(d);
            }
        }
    );
};
/* ................................... Server Date */
/*
Date_UsernameDelay = function(servertime) {
	Date.prototype.server_time_delay = (new Date(servertime) - new Date());
};
Date.prototype.getFixed = function() {
  if(typeof(this.server_time_delay)=='number') 
    this.setMilliseconds(this.getMilliseconds() + this.server_time_delay);

  return this;
};
*/