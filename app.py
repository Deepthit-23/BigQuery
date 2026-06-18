import xml.etree.ElementTree as ET
import requests
from flask import Flask, jsonify, render_template, request
from bs4 import BeautifulSoup
import html

app = Flask(__name__)

# URL of the BigQuery release notes RSS/Atom feed
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_entry_content(content_html):
    """
    Parses the HTML content of a feed entry to split it by <h3> sections.
    BigQuery release notes format typically contains:
    <h3>Type</h3>
    <p>Details...</p>
    """
    if not content_html:
        return []

    soup = BeautifulSoup(content_html, 'html.parser')
    
    items = []
    current_type = None
    current_content = []
    
    # Iterate through root-level elements of the parsed HTML
    for element in soup.contents:
        # If it's a tag and is h3, it signals a new release note item
        if hasattr(element, 'name') and element.name == 'h3':
            # Save the previous item if it exists
            if current_type and current_content:
                items.append({
                    'type': current_type,
                    'content_html': ''.join(str(e) for e in current_content).strip()
                })
            current_type = element.get_text().strip()
            current_content = []
        else:
            # Accumulate content for the current heading
            current_content.append(element)
            
    # Add the last section
    if current_type and current_content:
        items.append({
            'type': current_type,
            'content_html': ''.join(str(e) for e in current_content).strip()
        })
        
    # Fallback if no <h3> tags were found but there is content
    if not items and content_html.strip():
        items.append({
            'type': 'Update',
            'content_html': content_html.strip()
        })
        
    return items

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        # Fetch the feed
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Parse XML
        xml_content = response.content
        root = ET.fromstring(xml_content)
        
        # Atom Namespace
        namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
        
        feed_title = root.find('atom:title', namespaces).text if root.find('atom:title', namespaces) is not None else "BigQuery Release Notes"
        feed_updated = root.find('atom:updated', namespaces).text if root.find('atom:updated', namespaces) is not None else ""
        
        entries = []
        
        for entry in root.findall('atom:entry', namespaces):
            title = entry.find('atom:title', namespaces).text
            updated = entry.find('atom:updated', namespaces).text
            
            # Extract link
            link_elem = entry.find("atom:link[@rel='alternate']", namespaces)
            link = link_elem.attrib['href'] if link_elem is not None else ""
            
            # Extract content HTML
            content_elem = entry.find('atom:content', namespaces)
            content_html = content_elem.text if content_elem is not None else ""
            
            # Parse individual items
            items = parse_entry_content(content_html)
            
            entries.append({
                'title': title, # Typically the date
                'updated': updated,
                'link': link,
                'items': items
            })
            
        return jsonify({
            'success': True,
            'feed_title': feed_title,
            'feed_updated': feed_updated,
            'entries': entries
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
