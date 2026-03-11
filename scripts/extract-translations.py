#!/usr/bin/env python3
"""
Extract translations from dictionaries.ts and create modular JSON files.
"""
import json
import re
import os
from pathlib import Path

# Read the dictionaries.ts file
dict_path = Path(__file__).parent.parent / 'src' / 'lib' / 'i18n' / 'dictionaries.ts'
with open(dict_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract language blocks
def extract_lang_block(lang_code):
    """Extract a language block from the TypeScript file."""
    pattern = rf'const {lang_code}: Dictionary = \{{(.*?)\}};'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return None
    return match.group(1)

# Simple TS to JSON converter (handles basic cases)
def ts_value_to_json(value_str):
    """Convert TypeScript value to JSON value."""
    value_str = value_str.strip()
    
    # Remove comments
    value_str = re.sub(r'//.*?$', '', value_str, flags=re.MULTILINE)
    value_str = re.sub(r'/\*.*?\*/', '', value_str, flags=re.DOTALL)
    
    # String
    if value_str.startswith('"') or value_str.startswith("'"):
        return value_str.strip('"\'')
    
    # Number
    if value_str.replace('.', '').replace('-', '').isdigit():
        return float(value_str) if '.' in value_str else int(value_str)
    
    # Boolean
    if value_str in ('true', 'false'):
        return value_str == 'true'
    
    # null
    if value_str == 'null':
        return None
    
    # Object (simplified)
    if value_str.startswith('{'):
        return parse_ts_object(value_str)
    
    # Array (simplified)
    if value_str.startswith('['):
        return parse_ts_array(value_str)
    
    return value_str

def parse_ts_object(obj_str):
    """Parse a TypeScript object to Python dict."""
    result = {}
    # This is a simplified parser - for production, use a proper TS parser
    # Remove outer braces
    obj_str = obj_str.strip('{}')
    
    # Split by commas, but respect nested objects/arrays
    depth = 0
    in_string = False
    escape_next = False
    current_key = None
    current_value = ''
    start_idx = 0
    
    i = 0
    while i < len(obj_str):
        char = obj_str[i]
        
        if escape_next:
            escape_next = False
            i += 1
            continue
        
        if char == '\\':
            escape_next = True
            i += 1
            continue
        
        if char in ('"', "'", '`'):
            in_string = not in_string
            i += 1
            continue
        
        if in_string:
            i += 1
            continue
        
        if char == '{' or char == '[':
            depth += 1
        elif char == '}' or char == ']':
            depth -= 1
        elif char == ':' and depth == 0:
            # Key-value separator
            current_key = obj_str[start_idx:i].strip().strip('"\'')
            start_idx = i + 1
        elif char == ',' and depth == 0:
            # End of current key-value pair
            current_value = obj_str[start_idx:i].strip()
            if current_key:
                result[current_key] = ts_value_to_json(current_value)
            current_key = None
            current_value = ''
            start_idx = i + 1
        
        i += 1
    
    # Handle last pair
    if current_key:
        current_value = obj_str[start_idx:].strip()
        result[current_key] = ts_value_to_json(current_value)
    
    return result

def parse_ts_array(arr_str):
    """Parse a TypeScript array to Python list."""
    # Simplified - just return empty for now
    return []

# Section extraction mappings
def extract_section(data, path):
    """Extract a nested section from the data."""
    keys = path.split('.')
    current = data
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return None
    return current

# For now, let's use a manual approach since TS parsing is complex
# We'll create the JSON files based on the structure we know

print("Translation extraction script")
print("Note: Due to TypeScript parsing complexity, JSON files will be created manually")
print("based on the dictionaries.ts structure.")
