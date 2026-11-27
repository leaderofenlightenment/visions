"""Generate the VISIONS learner manual. Requires reportlab."""
import json
from pathlib import Path
from xml.sax.saxutils import escape

import reportlab
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / 'lib/guided-catalog.json').read_text())
TARGET = ROOT / 'public/visions-user-guide.pdf'
W, H = A4
P = 44
INK = '#201633'
MUTED = '#514563'
PAPER = '#fbf9ff'
TOPICS = {'lifestyle': 'Theosis', 'business': 'Creativity', 'relationships': 'Psychology'}
PAGE_COUNT = len(CATALOG['movements']) + 2
LENS_COLORS = ['#8b6100', '#8a460d', '#763484', '#17628b', '#25573f', '#912f3a', '#364da0']
system_fonts = Path('/usr/share/fonts/truetype/liberation')
bundled_fonts = Path(reportlab.__file__).resolve().parent / 'fonts'
for name, system_name, fallback in (
    ('GuideSans', 'LiberationSans-Regular.ttf', 'Vera.ttf'),
    ('GuideBold', 'LiberationSans-Bold.ttf', 'VeraBd.ttf'),
    ('GuideTitle', 'LiberationSerif-Bold.ttf', 'VeraBd.ttf'),
):
    font_file = system_fonts / system_name
    pdfmetrics.registerFont(TTFont(name, str(font_file if font_file.exists() else bundled_fonts / fallback)))
pdf = canvas.Canvas(str(TARGET), pagesize=A4, pageCompression=1, invariant=1)
pdf.setTitle('VISIONS Reality Codex | User Manual')
pdf.setAuthor('VISIONS Reality Codex')


def paragraph(value, x, top, width=W - 2 * P, size=11, leading=15, color=INK, font='GuideSans'):
    style = ParagraphStyle(name='Guide', fontName=font, fontSize=size, leading=leading,
                           textColor=HexColor(color), alignment=TA_LEFT)
    block = Paragraph(escape(value), style)
    _, height = block.wrap(width, H)
    block.drawOn(pdf, x, top - height)
    return top - height


def begin(page, kicker, heading, subtitle):
    pdf.setFillColor(HexColor(PAPER))
    pdf.rect(0, 0, W, H, fill=1, stroke=0)
    pdf.setFillColor(HexColor('#1f1730'))
    pdf.rect(0, H - 184, W, 184, fill=1, stroke=0)
    pdf.setStrokeColor(HexColor('#bf91ff'))
    pdf.setLineWidth(1.3)
    mark = pdf.beginPath()
    mark.moveTo(W - 82, H - 49)
    mark.lineTo(W - 60, H - 87)
    mark.lineTo(W - 104, H - 87)
    mark.close()
    pdf.drawPath(mark)
    pdf.circle(W - 82, H - 74, 8)
    paragraph('VISIONS REALITY CODEX  /  ' + kicker.upper(), P, H - 48, size=9, color='#d3bcfa', font='GuideBold')
    bottom = paragraph(heading, P, H - 75, W - P - 115, 29, 32, '#ffffff', 'GuideTitle')
    paragraph(subtitle, P, bottom - 10, W - 2 * P - 18, 10, 14, '#e4d7ed')
    pdf.setStrokeColor(HexColor('#d7cbea'))
    pdf.line(P, 48, W - P, 48)
    paragraph('THE MASTER CREATOR  /  VISIONS USER MANUAL', P, 35, size=8, color=MUTED)
    pdf.setFillColor(HexColor(MUTED))
    pdf.setFont('GuideSans', 8)
    pdf.drawRightString(W - P, 28, f'{page} / {PAGE_COUNT}')
    return H - 211


def section(top, number, title, body, color='#7043ab'):
    pdf.setFillColor(HexColor(color))
    pdf.circle(P + 12, top - 12, 12, fill=1, stroke=0)
    pdf.setFillColor(HexColor('#ffffff'))
    pdf.setFont('GuideBold', 10)
    pdf.drawCentredString(P + 12, top - 16, number)
    end = paragraph(title, P + 35, top, W - 2 * P - 35, 13, 16, INK, 'GuideBold')
    return paragraph(body, P + 35, end - 5, W - 2 * P - 35, 11, 15, MUTED) - 18


def note(top, label, body):
    end = paragraph(label, P, top, size=10, leading=14, font='GuideBold')
    return paragraph(body, P, end - 5, size=10, leading=14, color=MUTED) - 15


y = begin(1, 'Start here', 'VISIONS Reality Codex',
          'How to use the VISIONS Core and carry your answers into everyday life.')
y = section(y, '01', 'Open the Core',
            'Select VISIONS Core from the sidebar or the center of the Nexus. Work through Vision, Interest, Story, Insight, Outcome, Negation, and Systemization in order.')
y = section(y, '02', 'Save each movement across three topics',
            'Each movement gives you one prompt for Theosis, one for Creativity, and one for Psychology. Save your answers before leaving the Core. You can return at any time and revise them.')
y = section(y, '03', 'Use your documents',
            'Open Lifestyle for your Rule of Life, Business for your Business Plan, and Relationships for your Relationship Management document. Each one updates from your saved Core answers and can be downloaded.')
y = note(y - 6, 'Read across content domains',
         'Health runs through Mind, Asceticism, and Self-Mastery. Wealth runs through Body, Skillset, and Household Dynamics. Relationships run through Soul, Community, and Ministry.')
y = note(y, 'Optional ChatGPT guide',
         'Open Use ChatGPT in the Core for the guide instructions. ChatGPT walks you through one movement per turn. You can review and import the finished map into VISIONS.')
note(y, 'Your answers belong to you',
     'Use your signed-in workspace for private entries. Your browser and account workspaces are separate. Theosis belongs to the sacramental and theological life of the Orthodox Church. Use pastoral guidance for personal spiritual questions.')
pdf.showPage()

for index, movement in enumerate(CATALOG['movements']):
    y = begin(index + 2, movement['name'], movement['title'], 'Answer these three prompts in the VISIONS Core.')
    y = paragraph(movement['reading'], P, y, size=10, leading=14, color=MUTED) - 20
    for domain, field in movement['prompts'].items():
        y = section(y, 'VISIONS'[index], TOPICS[domain] + ' — ' + field['pillar'], field['prompt'], LENS_COLORS[index])
    if y < 64:
        raise RuntimeError('Workbook page overflow: ' + movement['name'])
    pdf.showPage()

y = begin(PAGE_COUNT, 'Workspaces and access', 'Put your answers to work',
          'Open The Master Creator materials inside the matching workspace.')
y = section(y, '01', 'Lifestyle',
            'Apply the Sacramental Lifestyle Worksheet and Modern Monastic bonus alongside your Rule of Life.')
y = section(y, '02', 'Business',
            'Use your Business Plan and Career Creation Clarity to define your work. Build your offer with The Vortex Funnel, then use the Digital Marketing Toolkit and Eden for content research, creation, and scheduling.')
y = section(y, '03', 'Relationships',
            'Use Interpersonal Dynamic Articulation and Threefold Partner Identification alongside your Relationship Management document.')
y = note(y, 'Bring a course answer into the Core',
         'Save your response in the material, then choose Add answer to VISIONS Core to review the movement and workspaces before saving a copy.')
y = note(y, 'Access and privacy',
         'VISIONS Core is free. Paid access to The Master Creator, VISIONS AI, and Work with Eric is arranged with the owner. Eden access is separate. The app sends only the business draft you explicitly approve to your Eden Library.')
note(y, 'Return to the method', CATALOG['closing'])
pdf.showPage()
pdf.save()
print(TARGET)
