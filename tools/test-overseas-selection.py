import json
import re
import unittest
from datetime import date
from pathlib import Path
from runpy import run_path


ROOT = Path(__file__).resolve().parents[1]
AS_OF = date(2026, 11, 19)
GENERATOR = run_path(str(ROOT / "tools/generate-activity-pages.py"))
classify = GENERATOR["classify_overseas_activity"]


class OverseasSelectionTest(unittest.TestCase):
    def item(self, title, summary, region, **changes):
        return {
            "id": "1",
            "title": title,
            "summary": summary,
            "institution": "示例机构",
            "region": region,
            "validFrom": "2026-11-01",
            "validTo": "2026-11-30",
            "sources": ["https://example.org/rules"],
            **changes,
        }

    def test_hong_kong_market_and_issuer_are_separate(self):
        cases = [
            ("信用卡·八達通增值", "香港發卡指定卡登記後回贈", "中國香港", ("hong-kong", "hk-transit-bills")),
            ("香港信用卡·惠康購物", "指定超市和網店滿額有回贈", "中國香港", ("hong-kong", "hk-shopping")),
            ("信用卡·香港本地繳費", "登記後本地零售簽賬滿額可享繳費回贈", "中國香港", ("hong-kong", "hk-transit-bills")),
            ("信用卡·日本簽賬回贈", "指定信用卡消費返現", "中國香港發卡·日本", ("travel", "travel-payments")),
            ("香港信用卡·上海机场专享", "指定卡在上海本地机场满减", "上海", None),
            ("信用卡·超市满减", "指定信用卡消费满减", "中国香港发卡", None),
            ("信用卡·消费回赠", "指定信用卡合资格消费回赠", "中国内地发卡·本地及境外合资格消费", ("travel", "travel-payments")),
        ]
        for title, summary, region, expected in cases:
            with self.subTest(title=title):
                self.assertEqual(classify(self.item(title, summary, region), AS_OF), expected)

    def test_shopping_and_travel_categories(self):
        cases = [
            ("信用卡·淘寶消費回贈", "香港用戶於淘寶香港 App 消費", "中國香港", ("shopping", "cross-border-stores")),
            ("银联卡·拼多多境外卡9折", "指定发卡地区用户付款立减", "中国内地购物·中国境外发卡", ("shopping", "cross-border-stores")),
            ("信用卡·海外刷卡回赠", "网上非港币零售签账合资格", "中国香港发卡·海外及网上非港币消费", ("shopping", "online-card-rewards")),
            ("国际集运减免", "指定线路集运满额减运费", "跨境配送", ("shopping", "cross-border-delivery")),
            ("海外网站·机票及酒店优惠", "线上订票或预订酒店满减", "全球指定目的地", ("travel", "flights")),
            ("Agoda 订房折扣", "指定酒店预订满额打折", "中国香港发卡·全球指定酒店", ("travel", "stays")),
            ("韩国景点门票优惠", "指定时段预订门票减免", "韩国", ("travel", "things-to-do")),
            ("银联境外留学缴费回赠", "指定信用卡缴学费满额回赠", "境外", None),
            ("信用卡·Amazon 礼品", "境内单笔刷卡奖励", "全国", None),
        ]
        for title, summary, region, expected in cases:
            with self.subTest(title=title):
                self.assertEqual(classify(self.item(title, summary, region), AS_OF), expected)

    def test_sources_dates_and_seasonal_exclusions(self):
        args = ("韩国酒店订房优惠", "指定卡订房满额减免", "韩国")
        for changes in (
            {"sources": []},
            {"sources": ["http://example.org/rules"]},
            {"validTo": "2026-11-18"},
            {"validFrom": "2026-11-20"},
        ):
            self.assertIsNone(classify(self.item(*args, **changes), AS_OF))
        self.assertIsNone(classify(self.item("韩国酒店黑五优惠", args[1], args[2]), AS_OF))
        self.assertEqual(classify(self.item(*args, validTo="2026-11-19"), AS_OF), ("travel", "stays"))

    def test_travel_data_requires_website_only_source(self):
        args = ("日本旅行 eSIM 优惠", "指定流量套餐打折", "日本")
        self.assertIsNone(classify(self.item(*args), AS_OF))
        self.assertEqual(classify(self.item(*args, distributionScope="web_only"), AS_OF), ("travel", "travel-data"))

    def test_website_page_exposes_only_populated_subcategories(self):
        feed = json.loads((ROOT / "activities/feed.json").read_text())["activities"]
        html = GENERATOR["overseas_hub_page"](feed, AS_OF)
        categories = {
            (group, child)
            for group, children in GENERATOR["OVERSEAS_SUBCATEGORIES"].items()
            for child, _ in children
        }
        populated = {classify(item, AS_OF) for item in feed} & categories
        for group, child in categories:
            self.assertEqual(f'id="{child}"' in html, (group, child) in populated)
            self.assertEqual(f'href="#{child}"' in html, (group, child) in populated)
        ids = re.findall(r'class="topic-activity-link" href="/activities/(\d+)\.html"', html)
        self.assertTrue(ids)
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all((ROOT / f"activities/{activity_id}.html").is_file() for activity_id in ids))


if __name__ == "__main__":
    unittest.main()
