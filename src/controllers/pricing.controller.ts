import { Request, Response } from "express";
import Pricing from "../models/Pricing";
import { AuthRequest } from "../middlewares/auth";

export const getPricingPlans = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filter construction
    const filter: any = {
      ...(req.query.category && { category: req.query.category }),
      ...(req.query.type && { type: req.query.type }),
      ...(req.query.status
        ? { status: req.query.status }
        : { status: "active" }),
      ...(req.query.featured !== undefined && {
        isFeatured: req.query.featured === "true",
      }),
      ...(req.query.popular !== undefined && {
        isPopular: req.query.popular === "true",
      }),
      ...(req.query.currency && { "price.currency": req.query.currency }),
      ...(req.query.period && { "price.period": req.query.period }),
    };

    // Price range
    if (req.query.minPrice || req.query.maxPrice) {
      filter["price.amount"] = {};
      if (req.query.minPrice) {
        filter["price.amount"].$gte = parseFloat(req.query.minPrice as string);
      }
      if (req.query.maxPrice) {
        filter["price.amount"].$lte = parseFloat(req.query.maxPrice as string);
      }
    }

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, "i");
      filter.$or = [
        { name: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { category: searchRegex },
        { "features.name": searchRegex },
      ];
    }

    const pricingPlans = await Pricing.find(filter)
      .populate("services", "title slug")
      .sort({
        isFeatured: -1,
        isPopular: -1,
        sortOrder: 1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    const total = await Pricing.countDocuments(filter);

    return res.json({
      success: true,
      data: pricingPlans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pricing plans",
      error: (error as Error).message,
    });
  }
};

export const getPricingPlansBySlug = async (req: Request, res: Response) => {
  try {
    const pricingPlan = await Pricing.findOne({
      slug: req.params.slug,
      status: "active",
    }).populate("services", "title slug description");

    if (!pricingPlan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    // Increment view count
    await Pricing.findByIdAndUpdate(
      pricingPlan._id,
      { $inc: { "analytics.views": 1 } },
      { new: false }
    );

    return res.json({
      success: true,
      data: pricingPlan,
    });
  } catch (error) {
    console.error("Error fetching pricing plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pricing plan",
    });
  }
};

export const trackPricingPlanClick = async (req: Request, res: Response) => {
  try {
    const pricingPlan = await Pricing.findOneAndUpdate(
      { slug: req.params.slug, status: "active" },
      { $inc: { "analytics.clicks": 1 } },
      { new: true }
    );

    if (!pricingPlan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    return res.json({
      success: true,
      message: "Click tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track click",
    });
  }
};

export const trackPricingPlanConversion = async (
  req: Request,
  res: Response
) => {
  try {
    const pricingPlan = await Pricing.findOneAndUpdate(
      { slug: req.params.slug, status: "active" },
      { $inc: { "analytics.conversions": 1 } },
      { new: true }
    );

    if (!pricingPlan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    return res.json({
      success: true,
      message: "Conversion tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking conversion:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track conversion",
    });
  }
};

export const getPricingStats = async (req: Request, res: Response) => {
  try {
    const stats = await Pricing.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          totalViews: { $sum: "$analytics.views" },
          totalClicks: { $sum: "$analytics.clicks" },
          totalConversions: { $sum: "$analytics.conversions" },
          averagePrice: { $avg: "$price.amount" },
          minPrice: { $min: "$price.amount" },
          maxPrice: { $max: "$price.amount" },
        },
      },
    ]);

    const typeStats = await Pricing.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          averagePrice: { $avg: "$price.amount" },
          totalViews: { $sum: "$analytics.views" },
          totalClicks: { $sum: "$analytics.clicks" },
          totalConversions: { $sum: "$analytics.conversions" },
        },
      },
    ]);

    return res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalPlans: 0,
          totalViews: 0,
          totalClicks: 0,
          totalConversions: 0,
          averagePrice: 0,
          minPrice: 0,
          maxPrice: 0,
        },
        byType: typeStats,
      },
    });
  } catch (error) {
    console.error("Error fetching pricing statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pricing statistics",
    });
  }
};

export const createPricingPlan = async (req: AuthRequest, res: Response) => {
  try {
    const pricingPlan = new Pricing(req.body);
    await pricingPlan.save();

    return res.status(201).json({
      success: true,
      message: "Pricing plan created successfully",
      data: pricingPlan,
    });
  } catch (error: any) {
    console.error("Error creating pricing plan:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Pricing plan with this name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create pricing plan",
      error: error.message,
    });
  }
};

export const updatePricingPlan = async (req: AuthRequest, res: Response) => {
  try {
    const pricingPlan = await Pricing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!pricingPlan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    return res.json({
      success: true,
      message: "Pricing plan updated successfully",
      data: pricingPlan,
    });
  } catch (error: any) {
    console.error("Error updating pricing plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update pricing plan",
      error: error.message,
    });
  }
};

export const deletePricingPlan = async (req: AuthRequest, res: Response) => {
  try {
    const pricingPlan = await Pricing.findByIdAndDelete(req.params.id);

    if (!pricingPlan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    return res.json({
      success: true,
      message: "Pricing plan deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting pricing plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete pricing plan",
      error: error.message,
    });
  }
};
