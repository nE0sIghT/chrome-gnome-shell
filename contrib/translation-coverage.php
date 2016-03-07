<?php
/*
    GNOME Shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

$translation_url = 'https://raw.githubusercontent.com/GNOME/chrome-gnome-shell/master/extension/_locales/%s/messages.json';
$reference_language = 'en';
$languages = array(
	'ar'		=> 'Arabic',
	'am'		=> 'Amharic',
	'bg'		=> 'Bulgarian',
	'bn'		=> 'Bengali',
	'ca'		=> 'Catalan',
	'cs'		=> 'Czech',
	'da'		=> 'Danish',
	'de'		=> 'German',
	'el'		=> 'Greek',
	'en'		=> 'English',
	'en_GB'		=> 'English (Great Britain)',
	'en_US'		=> 'English (USA)',
	'es'		=> 'Spanish',
	'es_419'	=> 'Spanish (Latin America and Caribbean)',
	'et'		=> 'Estonian',
	'fa'		=> 'Persian',
	'fi'		=> 'Finnish',
	'fil'		=> 'Filipino',
	'fr'		=> 'French',
	'gu'		=> 'Gujarati',
	'he'		=> 'Hebrew',
	'hi'		=> 'Hindi',
	'hr'		=> 'Croatian',
	'hu'		=> 'Hungarian',
	'id'		=> 'Indonesian',
	'it'		=> 'Italian',
	'ja'		=> 'Japanese',
	'kn'		=> 'Kannada',
	'ko'		=> 'Korean',
	'lt'		=> 'Lithuanian',
	'lv'		=> 'Latvian',
	'ml'		=> 'Malayalam',
	'mr'		=> 'Marathi',
	'ms'		=> 'Malay',
	'nl'		=> 'Dutch',
	'no'		=> 'Norwegian',
	'pl'		=> 'Polish',
	'pt_BR'		=> 'Portuguese (Brazil)',
	'pt_PT'		=> 'Portuguese (Portugal)',
	'ro'		=> 'Romanian',
	'ru'		=> 'Russian',
	'sk'		=> 'Slovak',
	'sl'		=> 'Slovenian',
	'sr'		=> 'Serbian',
	'sv'		=> 'Swedish',
	'sw'		=> 'Swahili',
	'ta'		=> 'Tamil',
	'te'		=> 'Telugu',
	'th'		=> 'Thai',
	'tr'		=> 'Turkish',
	'uk'		=> 'Ukrainian',
	'vi'		=> 'Vietnamese',
	'zh_CN'		=> 'Chinese (China)',
	'zh_TW'		=> 'Chinese (Taiwan)'
);

function get_translation($code)
{
	global $languages, $translation_url;

	if(!array_key_exists($code, $languages))
	{
		return false;
	}

	if(($plain = @file_get_contents(sprintf($translation_url, $code))) !== false)
	{
		return json_decode($plain, true);
	}

	return false;
}

$reference_strings = get_translation($reference_language);
$reference_count = sizeof($reference_strings);
if(!$reference_strings)
{
	echo "No reference strings found";
	exit(1);
}
?>
<!doctype html>
<html>
	<head>
		<title>GNOME Shell integration for Chrome translation coverage</title>
		<link rel="stylesheet" href="https://l10n.gnome.org/static/css/template.css" />
		<style type="text/css">
			html
			{
				background: none;
			}

			table
			{
				width: 700px !important;
			}
		</style>
	</head>
</html>
<body>
	<table class='stats'>
		<thead>
			<tr>
				<th>Language</th>
				<th>Translated</th>
				<th>Missing</th>
				<th>Redundant</th>
				<th>Progress</th>
			</tr>
		</thead>
		<tbody>
</body>
<?php

foreach($languages as $code => $language)
{
	if($code == $reference_language)
	{
		continue;
	}

	$missing = array();
	$redundant = array();

	$strings = get_translation($code);
	if($strings)
	{
		foreach($reference_strings as $string => $data)
		{
			if(!array_key_exists($string, $strings))
			{
				$missing[] = $string;
			}
		}

		foreach($strings as $string => $data)
		{
			if(!array_key_exists($string, $reference_strings))
			{
				$redundant[] = $string;
			}
		}

		$missing_count = sizeof($missing);
		$translated = floor((($reference_count - $missing_count) / $reference_count)  * 100);
	}
	else
	{
		$missing_count = $reference_count;
		$translated = 0;
		$missing[] = 'all';
	}

	?>
	<tr>
		<td><?= "$language ($code)" ?></td>
		<td><?=  "$translated%" ?></td>
		<td><?= implode(', ', $missing) ?></td>
		<td><?= implode(', ', $redundant) ?></td>
		<td>
			<div class="graph">
				<div class="translated" style="width: <?= $translated ?>px;"></div>
				<div class="untranslated" style="left: 100px; width: <?= (100 - $translated) ?>px;"></div>
			</div>
		</td>
	</tr>
	<?php
}
?>
	</tbody>
	</table>
</body>
</html>
