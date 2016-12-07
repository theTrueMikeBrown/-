using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace トマト.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index(int id = 0)
        {
            return View(id);
        }
    }
}