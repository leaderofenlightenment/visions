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
ACCENT = { 'lifestyle': '#25573f', 'business': '#7f402a', 'relationships': '#663877' }
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
    pdf.drawRightString(W - P, 28, f'{page} / 5')
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


y = begin(1, 'Start here', 'A practical guide to VISIONS',
          'A free, guided framework for Lifestyle, Business, and Relationships.')
y = section(y, '01', 'Fill in the framework',
            'Open Guided Framework from the Nexus. Start with Lifestyle, then work through Business and Relationships. Each domain has seven prompts. Save a domain before leaving the page. You can return to finish the other prompts later.')
y = section(y, '02', 'See what you saved in the network',
            'Return to Dashboard. Each saved answer becomes an idea under its VISIONS lens and domain. Related guided answers connect as you fill in the framework. Open a colored branch to inspect the ideas inside it.')
y = section(y, '03', 'Use your three domain documents',
            'Open Lifestyle, Business, or Relationships in the sidebar. Each document gathers your saved framework answers and course applications. Edit an answer from Guided Framework to update it everywhere. Download a document to keep a copy.')
y = note(y - 6, 'One way to start',
         'In Lifestyle, describe an evening rhythm under Vision of Theosis. Save it. Then consider how the same rhythm changes the time available for your work and the people you live with.')
y = note(y, 'Your answers belong to you',
     'Use your signed-in workspace for private entries. You can also start with non-sensitive notes stored on this device. Your browser and account workspaces are separate. Theosis belongs to the sacramental and theological life of the Orthodox Church. Use pastoral guidance for personal spiritual questions.')
note(y, 'Read across domains',
     'Health connects Mind, Asceticism, and Self-Mastery. Wealth connects Body, Skillset, and Household Dynamics. Relationships connect Soul, Community, and Ministry. Compare the answers you save under the same lens.')
pdf.showPage()

for page, domain in enumerate(CATALOG, start=2):
    name = domain['id'].title()
    y = begin(page, name, domain['title'], 'Sub-pillars: ' + '  /  '.join(domain['pillars']))
    for i, (lens, title, pillar, prompt) in enumerate(domain['prompts']):
        y = section(y, 'VISIONS'[i], title + '  /  ' + pillar, prompt, LENS_COLORS[i])
    if y < 64:
        raise RuntimeError('Workbook page overflow: ' + name)
    pdf.showPage()

y = begin(5, 'Course and access', 'From learning to practice',
          'Save what you learn, then choose what belongs in your Core.')
y = section(y, '01', 'Read the course in VISIONS',
            'Open Course and choose Read in VISIONS. The Master Creator course requires enrollment. Type in the response spaces you encounter in a lesson and choose Save answer to return to that answer later.')
y = section(y, '02', 'Send a chosen answer to your Core',
            'Choose Add answer to VISIONS Core, check the lens and life domains, and save the idea. The course keeps the original response. The network and domain document show the version you confirm for the Core.')
y = note(y, 'Free · VISIONS Framework', 'All 21 prompts, the network, and three personal documents.')
y = note(y, '$33 · The Master Creator', 'Course materials, worksheet answers, and applications in your Core.')
y = note(y, '$333 · VISIONS AI', 'Course access plus AI support for content drafts, lifestyle planning, and relationship reflection. Provider configuration is required.')
y = note(y, '$3,333 · Work with Eric',
         'Personal support for music, content, and thumbnails, lifestyle coaching, and relationship discernment. Marital advice is outside the offer.')
note(y, 'Access and privacy',
     'Paid access is arranged with the owner. The app has no online checkout. AI uses the intention and source passages you explicitly choose to share.')
pdf.showPage()
pdf.save()
print(TARGET)
